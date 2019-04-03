# Content-File-Handing

## Endpoints (`/files/...`)

### `POST /upload?path={{path to store}}`

Upload einer Datei in einen tmp-folder.
Der Upload muss mit dem Header `multipart/form-data` erfolgen und jede Datei muss eine einzelne request sein.
Zurückgegeben wird ein eindeutiger identifier für diese Datei.
Dieser Identifier muss in einer weiteren `POST /manage` (siehe unten) verwendet werden um die Datei zu persistieren
und öffentlich zugänglich zu machen.

### `GET /get/**/*.*`

Liefert die entsprechende Datei unter dem angegebenen Pfad aus.
Zusätzlich soll hier die Rechteprüfung stattfinden. (not implemented)

### `POST /manage (JSON)`

This endpoint allows modifications to the main source folder,
you can specify files that should be deleted (`delete: [...]`)
and specify which files should be moved from the tmp upload directory to it's final destination.
The tmp-folder prefix will be added by the server itself.

```js
{
  "delete": [
    "fileId",
    // ...
  ],
  "save": [
    "fileId",
    // ...
  ]
}
```