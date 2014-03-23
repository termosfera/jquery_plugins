/* 
 * Plugin para cargar tablas con datos obtenidos por AJAX
 */

(function($) {
    
    $.fn.ajaxLoadTables = function(opts, value) {
        
        return this.each(function(indice, tabla) {
            
            if (typeof opts === 'string') {
                if (opts === 'load') {
                    var preparacion = $(tabla).data('preparacion');
                    if (typeof preparacion === 'undefined')
                        return;
                    load(preparacion, false);
                }

                if (opts === 'primero') {
                    var preparacion = $(tabla).data('preparacion');
                    if (typeof preparacion === 'undefined')
                        return;
                    preparacion.opciones.params.offset = 0;
                    paginar(preparacion.opciones);
                    load(preparacion);
                }

                if (opts === 'siguiente') {
                    var preparacion = $(tabla).data('preparacion');

                    if (typeof preparacion === 'undefined' ||
                            (preparacion.opciones.params.offset +
                                    preparacion.opciones.params.limit) >=
                            preparacion.regTotales)
                        return;

                    preparacion.opciones.params.offset +=
                            preparacion.opciones.params.limit;

                    paginar(preparacion.opciones);

                    load(preparacion);
                }

                if (opts === 'anterior') {
                    var preparacion = $(tabla).data('preparacion');
                    if (typeof preparacion === 'undefined' ||
                            preparacion.opciones.params.offset <= 0)
                        return;
                    preparacion.opciones.params.offset -=
                            preparacion.opciones.params.limit;

                    paginar(preparacion.opciones);

                    load(preparacion);
                }

                if (opts === 'ultimo') {
                    var preparacion = $(tabla).data('preparacion');

                    if (typeof preparacion === 'undefined')
                        return;

                    preparacion.opciones.params.offset = 'ultimo';

                    paginar(preparacion.opciones);

                    load(preparacion);
                }

                if (opts === 'registros') {
                    var preparacion = $(tabla).data('preparacion');

                    if (typeof preparacion === 'undefined')
                        return;

                    preparacion.opciones.params.offset = 0;
                    preparacion.opciones.params.limit = parseInt(value);

                    paginar(preparacion.opciones);

                    load(preparacion);
                }

                if (opts === 'filtrar') {
                    var preparacion = $(tabla).data('preparacion');

                    if (typeof preparacion === 'undefined')
                        return;

                    preparacion.opciones.params.offset = 0;
                    preparacion.opciones.params.query = $.trim(value);

                    paginar(preparacion.opciones);

                    load(preparacion, true);
                }
            }

            if (typeof opts === 'object') {
                var preparacion = {};
                preparacion.tabla = tabla;
                preparacion.opciones = $.extend({},
                        $.fn.ajaxLoadTables.defaults, opts);

                $(tabla).data('preparacion', preparacion);
            }

        });
    };    

    function load(par, pagi) {
        $.ajax({
            type: "POST",
            url: par.opciones.url,
            data: par.opciones.params,
            dataType: 'JSON',
            success: function(obj) {
                console.log(obj);
                par.opciones.regTotales = parseInt(obj.total);
                if ((pagi) && (pagi === true)) {
                    paginar(par.opciones);
                }
                render(obj, par);
            },
            error: function() {
                console.warn("Error while loading data");
            }
        });

    }

    function render(obj, par) {
        var root = par.opciones.root;
        var configColumns = par.opciones.cols;
        
        var $table = $(par.tabla);
        var $thead;
        var $tbody;
        
        $table.empty();

        $thead = renderHead(par);
        $tbody = renderBody(obj, root, configColumns);
        
        $table.append($thead);
        $table.append($tbody);
        renderLeyend(par);
        
    }
    
    function renderHead(par) {        
        var $thead = $('<thead>');
        var $fila = $('<tr>');
        
        $.each(par.opciones.cols, function(i, v) {

            if (v.ordenar) {
                var $th = $('<th class="ordenar">' + v.nombre + '</th>');

                $fila.append($th);
                $th.click(function() {
                    var orden = par.opciones.params.ordenar;
                    
                    if (orden === 'ASC') {
                        orden = 'DESC';
                    } else {
                        orden = 'ASC';
                    }
                    par.opciones.params.ordenar = orden;
                    par.opciones.params.ordenarPor = v.ordenar;
                    
                    load(par, true);
                });

            } else {
                var $th = $('<th>' + v.nombre + '</th>');

                $fila.append($th);
            }
        });
        
        $thead.append($fila);
        
        return $thead;
        
    }
    
    function renderBody(obj, root, configColumns) {
        var $tbody = $('<tbody>');
        
        $(obj[root]).each(function(iFila, fila) {
            var $filaTbody = $('<tr>');

            $(configColumns).each(function(iColumna, columna) {
                if (typeof columna.renderer === 'function') {
                    var dataToRender = columna.renderer();
                    var $td = $('<td>' + dataToRender + '</td>');

                    $filaTbody.append($td);

                } else {
                    var $td = $('<td>' + fila[columna.dato] + '</td>');

                    $filaTbody.append($td);
                }
            });
            $tbody.append($filaTbody);

        });
        
        return $tbody;
    }

    function renderLeyend(par) {
        var msg = 'No hay registros';
        var regTotales = par.opciones.regTotales;
        var posPrimeraLinea = par.opciones.params.offset;
        var limite = par.opciones.params.limit;
        var inicio, 
            fin;

        if (regTotales !== 0) {
            inicio = posPrimeraLinea + 1;
        }

        fin = limite + posPrimeraLinea;

        if (fin > regTotales) {
            fin = regTotales;
        }

        msg = 'Del ' + inicio + ' al ' + fin + ' de ' + regTotales;

        if (fin > regTotales) {
            fin = regTotales;
        }

        var $leyenda = $('.' + par.opciones['cls-leyenda']);
        $leyenda.attr('placeholder', msg);
        
    }
    
    function paginar(opciones) {
        var pagTotal = parseInt(opciones.regTotales / opciones.params.limit);

        if (opciones.regTotales % opciones.params.limit !== 0) {
            pagTotal++;
        }

        opciones.params.paginaTotal = pagTotal;

        var pagActual = 'pagina actual';

        if (opciones.params.offset <= 0) {
            pagActual = 1;

        } else if ((opciones.params.offset === 'ultimo') ||
                (opciones.params.offset >= opciones.regTotales)) {
            console.warn('Estamos en la ultima pagina');
            pagActual = pagTotal;
            opciones.params.offset = (pagActual - 1) * opciones.params.limit;

        } else {
            pagActual = (opciones.params.offset / opciones.params.limit) + 1;

        }

        opciones.params.offset = (pagActual - 1) * opciones.params.limit;
        opciones.params.paginaActual = pagActual;
        
    }

    $.fn.ajaxLoadTables.defaults = {
        root: 'filas',
        total: 'totalFilas',
        id: 'idFila',
        params: {
            limit: 3,
            offset: 0,
            query: '',
            ordenar: ''
        }
    };

})(jQuery);

