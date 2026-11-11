export default function Page() {
  return (
    <main className="legal">
      <a href="/">← Back to studio</a>
      <div className="eyebrow">
        SIRIUS WRITERS STUDIO · DEVELOPMENT POLICY · NOVEMBER 2026
      </div>
      <h1>Your words belong to you.</h1>
      <p>
        This policy describes the working development preview. Public
        registration remains closed while SIRIUS finalizes its legal
        entity/contact details, retention schedule, hosting locations, and Oman
        privacy and younger-user requirements.
      </p>
      <h2>What we store</h2>
      <p>
        Registration requires your name, email and internationally formatted
        phone number. You may add a preferred name, city, country, discipline
        and creative interests. We store your consent choice/history and policy
        version, registration and recent activity times, your private projects,
        writing, ideas, tasks, saved words, snapshots, chord progressions and
        preferences.
      </p>
      <h2>Private by default</h2>
      <p>
        You retain ownership of original work. We do not sell personal
        information or use private drafts for AI training. The administrator
        directory contains contact and consent information; it does not include
        your drafts. Routine administration does not grant access to writing.
        Authorized infrastructure operators may process stored data to provide,
        secure, or restore the service.
      </p>
      <h2>Browser access and recovery</h2>
      <p>
        A secure browser cookie contains a random session credential; the server
        stores its hash. Artist sessions expire after 30 days. We do not
        identify you by IP address or browser fingerprinting. Short-lived hashed
        network metadata may limit abuse. Recovery links verify your email,
        expire after 15 minutes and can be used once. Successful artist recovery
        revokes previous sessions.
      </p>
      <h2>Your device and autosave</h2>
      <p>
        Unsaved writing is also kept in a recovery copy in this browser’s
        storage, associated with your artist ID. It is removed after a
        successful server save. Avoid shared devices for private material.
        Exporting a file creates a copy you control outside the service.
      </p>
      <h2>Community communications</h2>
      <p>
        Marketing permission is optional, unchecked at registration and separate
        from tool access. Change it in Settings. Promotional contact exports
        include only currently opted-in artists, and sensitive administrative
        actions are audited.
      </p>
      <h2>Providers and AI</h2>
      <p>
        Production is designed for Supabase database hosting, Vercel-compatible
        application hosting and a separately configured email delivery service.
        Final provider/region details will be disclosed before public launch.
        Development data is stored on this cloud development server; test
        contacts only should be used. Core dictionary and piano tools operate
        from bundled data/samples. No AI provider is enabled, and no draft text
        is sent to an AI service.
      </p>
      <h2>Export, deletion and questions</h2>
      <p>
        Settings provides a full workspace JSON export and confirmed account
        deletion. Deletion removes the artist profile, sessions and associated
        creative records from the active application database; independently
        exported files remain under your control. Production backup expiry,
        email-provider retention, a privacy contact and response procedures must
        be published before launch.
      </p>
      <h2>Preview eligibility</h2>
      <p>
        This preview is for invited adult testers using test contact details.
        Public age eligibility and any guardian-consent requirements remain
        subject to the Oman launch review.
      </p>
    </main>
  );
}
