# Privacy policy / Datenschutzerklärung

Effective date / Gültig ab: 30 August 2026

## Deutsch

### Kurzfassung

OneLessVideo verarbeitet alle für seine Funktion benötigten Daten lokal im Browser. Die Erweiterung betreibt keinen Server, überträgt keine Nutzungsdaten an den Entwickler oder Dritte und verwendet keine Analyse-, Werbe- oder Trackingdienste.

### Lokal verarbeitete Daten

OneLessVideo verarbeitet vorübergehend folgende Informationen, um seine sichtbare Kernfunktion bereitzustellen:

- die aktuelle YouTube-URL und die darin enthaltene Video-ID, um neue reguläre Videoseiten zu erkennen;
- den vom Nutzer ausgewählten Grund und den eingegebenen Absichtstext innerhalb des eingeblendeten Dialogs;
- den Zustand des YouTube-Videoplayers, um die Wiedergabe bis zur bewussten Freigabe zu pausieren.

Diese Informationen verbleiben auf dem Gerät. Video-ID, URL, Grund und Absichtstext werden weder gespeichert noch protokolliert oder übertragen. Beim Schließen oder Abbrechen des Dialogs wird dessen DOM einschließlich der Eingaben entfernt.

### Gespeicherte Einstellungen

Die konfigurierten Einstellungen werden über `browser.storage.local` im lokalen Erweiterungsspeicher des Browsers gespeichert. Dazu gehören beispielsweise, ob OneLessVideo aktiviert ist, welche Interventionsschritte eingeschaltet sind sowie deren numerische Grenzwerte. Die Einstellungen enthalten keine Videohistorie und keinen Absichtstext.

Die Einstellungen bleiben bis zu einer Änderung, dem Zurücksetzen der Erweiterungsdaten oder der Deinstallation gespeichert. Sie können über die Optionsseite geändert und durch Löschen der Erweiterungsdaten beziehungsweise Deinstallation vollständig entfernt werden.

### Berechtigungen

OneLessVideo verwendet ausschließlich:

- `storage`, um die oben beschriebenen lokalen Einstellungen zu speichern und Änderungen an bereits geöffneten Erweiterungskontexten mitzuteilen;
- Zugriff auf `https://www.youtube.com/*`, um die Intervention auf unterstützten YouTube-Seiten anzuzeigen und den dortigen Videoplayer zu pausieren.

Die Erweiterung fordert insbesondere keinen Zugriff auf den allgemeinen Browserverlauf, alle Websites, Tabs, Netzwerkverkehr oder Benachrichtigungen an.

### Datenerhebung, Weitergabe und Verkauf

Der Entwickler erhält keine personenbezogenen Daten oder Nutzungsdaten aus der Erweiterung. OneLessVideo verkauft oder teilt keine Daten und erstellt keine Nutzerprofile. Es gibt keine Konten, Cookies, Telemetrie, Analysen, Werbung oder externe Laufzeitdienste.

YouTube ist ein unabhängiger Drittanbieterdienst. Dessen eigene Datenverarbeitung wird durch diese Datenschutzerklärung nicht geregelt. OneLessVideo fügt YouTube keine Datenübertragung hinzu.

### Änderungen

Wenn sich die Datenverarbeitung von OneLessVideo ändert, wird diese Datenschutzerklärung vor oder zusammen mit der entsprechenden Veröffentlichung aktualisiert. Funktionen, die neue Datenübertragungen einführen würden, erfordern eine erneute Datenschutzprüfung und eine klare Offenlegung gegenüber den Nutzern.

### Kontakt

Fragen zur Datenschutzpraxis können über das [GitHub-Repository](https://github.com/Kamitoad/one-less-video/issues) gestellt werden. Bitte veröffentliche dort keine persönlichen oder sensiblen Informationen. Sicherheitsprobleme sollten gemäß der [Sicherheitsrichtlinie](SECURITY.md) vertraulich gemeldet werden.

## English

### Summary

OneLessVideo processes all data required for its functionality locally in the browser. The extension operates no server, transmits no usage data to the developer or third parties, and uses no analytics, advertising, or tracking services.

### Data processed locally

OneLessVideo temporarily processes the following information to provide its visible core functionality:

- the current YouTube URL and its video ID to recognize new regular video pages;
- the reason selected by the user and the intention text entered in the displayed dialog;
- the state of the YouTube video player so playback can remain paused until the user deliberately approves it.

This information stays on the device. The video ID, URL, reason, and intention text are not stored, logged, or transmitted. When the dialog is closed or aborted, its DOM, including the entered information, is removed.

### Stored settings

Configured settings are stored through `browser.storage.local` in the browser's local extension storage. They include whether OneLessVideo is enabled, which intervention steps are enabled, and their numeric limits. Settings contain no video history or intention text.

Settings remain until they are changed, the extension's data is cleared, or the extension is uninstalled. They can be changed on the options page and completely removed by clearing extension data or uninstalling the extension.

### Permissions

OneLessVideo uses only:

- `storage`, to save the local settings described above and notify already open extension contexts about changes;
- access to `https://www.youtube.com/*`, to display the intervention on supported YouTube pages and pause the video player on those pages.

In particular, the extension does not request access to general browsing history, all websites, tabs, network traffic, or notifications.

### Collection, sharing, and sale

The developer receives no personal data or usage data from the extension. OneLessVideo does not sell or share data and does not create user profiles. There are no accounts, cookies, telemetry, analytics, advertisements, or external runtime services.

YouTube is an independent third-party service. Its own data practices are not governed by this policy. OneLessVideo does not add any transmission of data to YouTube.

### Changes

If OneLessVideo's data practices change, this policy will be updated before or together with the relevant release. Any feature that would introduce a new data transmission requires a renewed privacy review and clear disclosure to users.

### Contact

Questions about these privacy practices can be submitted through the [GitHub repository](https://github.com/Kamitoad/one-less-video/issues). Do not post personal or sensitive information there. Security concerns should be reported privately according to the [security policy](SECURITY.md).
