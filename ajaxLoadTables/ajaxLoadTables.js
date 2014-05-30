'use strict';

;(function($) {

    $.fn.ajaxLoadTables = function(opts, value) {

        return this.each(function(index, table) {
            // El atributo options contendra las opciones de configuracion
            // pasadas al plugin que extenderan las opciones por defecto.
            // Ademas, contendra informacion obtenida del servidor como el total
            // de filas e incluso las propias filas.
            var options;

            if (typeof opts === 'string' || opts === 'load') {
                options = getTableOptions(table);

                if (typeof options === 'undefined') {
                    var errorMessage = 'No ha introducido configuracion\n\
                                        El plugin no puede funcionar.'
                    console.error(errorMessage);
                    return; // En caso de no disponer de configuracion detenemos plugin
                }

                if (opts === 'primero') {
                    options.params.offset = 0;
                }

                if (opts === 'anterior') {
                    if (options.params.offset <= 0)
                        alert("Esta es la primera pagina!");
                    else
                        options.params.offset = options.params.offset - options.params.limit;
                }

                if (opts === 'siguiente') {
                    if ((options.params.offset + options.params.limit) >= options.total)
                        alert("Ha llegado a la ultima pagina!");
                    else
                        options.params.offset = options.params.offset + options.params.limit;
                }

                if (opts === 'ultimo') {
                    options.params.offset = options.total - options.params.limit;
                }

                if (opts === 'filtrar' && typeof value === 'string') {
                    options.params.query = value;
                }

                if (opts === 'registros' && typeof value === 'number') {
                    options.params.limit = value;
                }

                init(table, options);
            }

            if (typeof opts === 'object') {
                options = $.extend({}, $.fn.ajaxLoadTables.defaults, opts);
                setTableOptions(table, options);
            }
        });
    };

    /**
     * Wrapper que asigna atributo options que contiene las opciones de 
     * configuracion establecidas en el plugin, además añade información 
     * extra suministrada por el sevidor como el total de filas a añadir en 
     * la tabla.
     * 
     * @param table Referencia a la tabla a la que aplicamos el plugin
     * @param opts Objeto con las opciones de configuracion.
     * 
     */
    function setTableOptions(table, opts) {
        transfer(table, opts, false);
    }

    /**
     * Devuelve el objeto de configuracion asociado a la tabla.
     * 
     * @param table
     * @returns Objecto de configuracion asociado a la tabla
     */
    function getTableOptions(table) {
        var options = $(table).data('options');

        return options;
    }
    
    /**
     * Gestion de datos y conexion con servidor a traves de AJAX.
     * 
     * @param {type} table
     * @param {type} opts
     * @param {type} render
     * @returns {undefined}
     */
    function transfer(table, opts, render) {
        var $table = $(table);
        
        $.post(opts.url, opts.params, function(data) {
            var jsonData = $.parseJSON(data);
            opts.root = jsonData.filas;
            opts.total = parseInt(jsonData.registros_totales);
            if (render)
                renderTable(table, jsonData, opts);
            else
                $table.data('options', opts);
        });
    }

    /**
     * Inicia el plugin y por tanto, el renderizado de la tabla.
     * 
     * @param table Tabla sobre la que aplicamos el plugin.
     * @param opts opciones de configuracion del plugin.
     * 
     */
    function init(table, opts) {
        transfer(table, opts, true);
    }

    /**
     * Renderiza la cabecera de la tabla conforme a las opciones de 
     * configuracion.
     * 
     * @param opts Opciones de configuracion.
     * @returns Object Elemento THEAD HTML.
     */
    function renderThead(opts) {
        var $thead = $('<thead>');
        var $tr = $('<tr>');
        var $th;

        $.each(opts.cols, function(i, v) {
            $th = $('<th>' + v.nombre + '</th>');

            if (v.ordenar === true) {
                if (!opts.params.sorted)
                    $th.addClass('ordenar');
                else if (opts.params.sortOrder === 'ASC')
                    $th.addClass('ordenar-ascendente');
                else if (opts.params.sortOrder === 'DESC')
                    $th.addClass('ordenar-descendente');

                $th.click(function() {
                    switchOrder(this, opts, v.dato);
                });
                $tr.append($th);
            } else {
                $tr.append($th);
            }
        });
        $thead.append($tr);

        return $thead;
    }

    /**
     * Gestiona la ordenacion de la tabla y cambia la clase mediante la cual
     * mostramos stick para conocer si el orden es descendente o ascendente.
     * 
     * @param element Elemento al que aplicamos la funcion.
     * @param opts Opciones de configuracion de la tabla.
     * @param columnName Nombre de la columna del objeto JSON usado para ordenar.
     * 
     */
    function switchOrder(element, opts, columnName) {
        var $this = $(element);
        var $table = $this.closest('table');

        opts.params.sortCol = columnName;

        if (opts.params.sortOrder === 'ASC') {
            opts.params.sortOrder = 'DESC';
        } else if (opts.params.sortOrder === 'DESC') {
            opts.params.sortOrder = 'ASC';
        }

        opts.params.sorted = true;

        init($table, opts);
    }

    /**
     * Renderizado del cuerpo de la tabla.
     * 
     * @param data Datos obtenidos mediante AJAX de servidor.
     * @param opts Opciones de configuracion de la tabla.
     * @returns Object Elemento TBODY HTML.
     */
    function renderTbody(data, opts) {
        var $tbody = $('<tbody>');
        var $tr;
        var $td;

        $.each(data.filas, function(rowIndex, libro) {
            $tr = $('<tr>');

            $.each(opts.cols, function(columnIndex, column) {
                if (typeof column.renderer === 'function') {
                    var rendered = column.renderer(rowIndex, columnIndex, data.filas);
                    $td = $('<td>' + rendered + '</td>');
                    $tr.append($td);
                } else {
                    $td = $('<td>' + libro[column.dato] + '</td>');
                    $tr.append($td);
                }
            });
            $tbody.append($tr);

        });

        return $tbody;
    }

    /**
     * Renderizado de la tabla.
     * 
     * @param table Tabla sobre la que aplicar renderizado
     * @param data Datos descargados de servidor.
     * @param opts Opciones de configuracion de la tabla.
     * 
     */
    function renderTable(table, data, opts) {
        var $table = $(table);
        var $thead = renderThead(opts);
        var $tbody = renderTbody(data, opts);

        paginar(opts);

        $table.empty();
        $table.append($thead);
        $table.append($tbody);
    }

    /**
     * En caso de existir elemento input con la clase "paginas", se aplicara
     * placeholder.
     * 
     * @param opts Opciones de configuracion de la tabla.
     * 
     */
    function paginar(opts) {
        var $paginador = $("#paginas");

        if (typeof $paginador === 'undefined' || !$paginador.is('input'))
            return;

        var total = parseInt(opts.total);
        var offset = parseInt(opts.params.offset);
        var limit = parseInt(opts.params.limit);
        var numPagina, pagina, ending;

        var module = (total % limit);
        
        // Obtenemos el numero total de paginas
        if (module === 0)
            numPagina = parseInt((total / limit));
        else
            numPagina = parseInt((total / limit) + 1);
        
        // Obtenemos la pagina actual
        if (offset === 0)
            pagina = 1;
        else if (offset >= total)
            pagina = numPagina;
        else
            pagina = parseInt((offset / limit) + 1);
        
        // Evitamos que el numero final sea superior al de elementos
        if ((offset + limit) >= total)
            ending = total;
        else
            ending = (offset + limit);

        var placeholder = 'Pagina ' + pagina + ' de ' + numPagina + 
            '. (Registro del ' + offset + ' al ' + ending +
            ' de ' + total + ')';

        $paginador.attr("placeholder", placeholder);
    }

    // Opciones de configuracion por defecto
    $.fn.ajaxLoadTables.defaults = {
        root: 'filas',
        total: 'totalFilas',
        id: 'idFila',
        params: {
            limit: 20,
            offset: 0,
            query: ''
        }
    };

})(jQuery);

