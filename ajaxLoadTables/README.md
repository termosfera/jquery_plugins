AjaxLoadTables
==============

Simple Plugin to populate a table with data obtained using ajax.

Instructions
============
```
var $table = $('your table/s');

// Set configuration
$table.ajaxLoadTables({
    'url': "www.example.url/json",
    'params': {
            'limit': 20,
            'offset': 0,
            'query': '',
            'sortCol': 'ISBN13_guiones',
            'sortOrder': 'DESC',
            'sorted': false
        },
        cols: [
            {'nombre': 'Isbn', 'dato': 'ISBN13_guiones', 'ordenar': true},
            {'nombre': 'Fec. Publicación', 'dato': 'fecha_public', 'ordenar': true},
            {'nombre': 'Colección', 'dato': 'coleccion'},
            {'nombre': 'Título', 'dato': 'titulo', 'renderer': rTitulo, 'ordenar': true}
        ]
    });

// Load plugin
$table.ajaxLoadTables('load');

```

Configuration parameters:
 - url: JSON resource with data to fill the table.
 - params: Pagination and sorting settings.
 - cols: Head title and elements to render on the table.

To Do
=====
 - Check consistency
 - Translate everything to english