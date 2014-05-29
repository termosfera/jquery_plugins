'use strict';

;(function($) {

    $.fn.ajaxLoadTables = function(opts, value) {

        return this.each(function(index, table) {
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
                options = $.extend({}, $.fn.ajaxLoadTables.defaults, opts);
                setTableOptions(table, options);
            }
        });
    };

    function setTableOptions(table, opts) {
        var $table = $(table);

        $.post(opts.url, opts.params, function(data) {
            var jsonData = $.parseJSON(data);
            opts.total = parseInt(jsonData.registros_totales);
            $table.data('options', opts);
        });
    }

    function getTableOptions(table) {
        var options = $(table).data('options');

        return options;
    }

    function init(table, opts) {
        $.post(opts.url, opts.params, function(data) {
            var jsonData = $.parseJSON(data);
            opts.root = jsonData.filas;
            renderTable(table, jsonData, opts);
        });
    }

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

    function renderTable(table, data, opts) {
        var $table = $(table);
        var $thead = renderThead(opts);
        var $tbody = renderTbody(data, opts);

        paginar(opts);

        $table.empty();
        $table.append($thead);
        $table.append($tbody);
    }

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

