==AjaxLoadTables==

Simple Plugin to populate a table with data obtained using ajax.

==Instructions==

table.ajaxLoadTables({
    'url': "www.example.url/json",
    'cls-leyenda': 'leyenda',
    params: {
        'limit': 15,
        'offset': 0,
        'ordenarPor': 'titular',
        'ordenarTipo': 'asc'
    },
    cols: [
        { nombre: 'header column name', dato: 'data attribute', renderer: functionToAddElementsInColumn, ordenar: order }
    ]
});

==To Do==
 - Translate everything to english