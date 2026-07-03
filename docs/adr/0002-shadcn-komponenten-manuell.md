# ADR 0002 – shadcn-Komponenten manuell einpflegen

Status: akzeptiert
Datum: 2026-07-03

## Kontext

shadcn/ui ist kein Paket, sondern kopierter Quellcode je Komponente. Die
`shadcn add`-CLI lädt die Komponenten von `ui.shadcn.com`. In der Build-Umgebung,
in der dieses Repo gepflegt und gebaut wird, ist diese Domain nicht erreichbar.

## Entscheidung

shadcn-Primitives werden bei Bedarf direkt als Dateien unter
`src/components/ui/` angelegt (der Quellcode ist ohnehin Copy-in). Die
shadcn-Konfiguration (`components.json`, `cn`-Helper, Theme-Variablen in
`src/index.css`) ist vorhanden, sodass die Struktur der offiziellen entspricht.

## Konsequenzen

- Neue Primitives werden manuell hinzugefügt statt per CLI gezogen.
- Nötige Radix-Abhängigkeiten je Komponente werden per npm mitinstalliert.
- Der Actions-Build ist nicht betroffen: Komponenten liegen fertig im Repo.
