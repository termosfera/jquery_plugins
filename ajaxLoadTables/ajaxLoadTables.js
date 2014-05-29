'use strict';

;
(function($) {

    $.fn.grid5 = function(opts, value) {

        return this.each(function(index, table) {
            // El atributo options contendra las opciones de configuracion
            // pasadas al plugin que extenderan las opciones por defecto.
            // Ademas, contendra informacion obtenida del servidor como el total
            // de filas e incluso las propias filas.
            var options;

            if (typeof opts === 'string' || opts === 'load') {
                options = getTableOptions(table);

                if (typeof options === 'undefined') {
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
                options = $.extend({}, $.fn.grid5.defaults, opts);
                setTableOptions(table, options);
            }
        });
    };

    /**
     * Asigna atributo options que contiene las opciones de configuracion
     * establecidas en el plugin, además añade información extra suministrada
     * por el sevidor como el total de filas a añadir en la tabla.
     * 
     * @param table Referencia a la tabla a la que aplicamos el plugin
     * @param opts Objeto con las opciones de configuracion.
     * 
     */
    function setTableOptions(table, opts) {
        var $table = $(table);

        $.post(opts.url, opts.params, function(data) {
            var jsonData = $.parseJSON(data);
            opts.total = parseInt(jsonData.registros_totales);
            $table.data('options', opts);
        });
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
     * Inicia el plugin y por tanto, el renderizado de la tabla.
     * 
     * @param table Tabla sobre la que aplicamos el plugin.
     * @param opts opciones de configuracion del plugin.
     * 
     */
    function init(table, opts) {
        $.post(opts.url, opts.params, function(data) {
            var jsonData = $.parseJSON(data);
            opts.root = jsonData.filas;
            renderTable(table, jsonData, opts);
        });
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
     * @param name Nombre de la columna del objeto JSON usado para ordenar.
     * 
     */
    function switchOrder(element, opts, name) {
        var $this = $(element);
        var $table = $this.closest('table');

        opts.params.sortCol = name;

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

        var desde = opts.params.offset;
        var hasta = opts.params.offset + opts.params.limit;
        var total = opts.total;

        var placeholder = "Del " + desde + " al " + hasta + " de " + total;

        $paginador.attr("placeholder", placeholder);
    }

    // Opciones de configuracion por defecto
    $.fn.grid5.defaults = {
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

