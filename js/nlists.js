"use strict";

var nList = function (options) {

    this._options = options;
    this._dataSettings = {
        page: 1,
        sorting: [],
        filters: []
    };

    this.setDefaultOptions(this._options);
    this.init(this._options);
    this.loadData(  this._options.table, 
                    this._options.columns, 
                    this._options.data, 
                    this._options.pageSize, 
                    this._dataSettings.page );
    

}

nList.prototype.setDefaultOptions = function(options){
    if(options == null)
        options = {
            style: {}
        };

    options.pageSize = options.pageSize || 20;
}

nList.prototype.init = function (options) {
    if (typeof options.container === 'string')
        options.container = document.getElementById(options.container);

    if (options.container == null)
        this.throwException("Container element not found");

    options.id = this.getTableId();

    options.table = this.createTableElement(options.id, options.style.table);
    this.appendTableToContainer(options.container, options.table);

    this.appendColumnHeaders(options.table, options.columns);
    this.appendBody(options.table);
    this.appendFooter(options.table);
}

nList.prototype.throwException = function (text) {
    throw "nList Exception: " + text;
}

nList.prototype.getTableId = function () {
    return new Date().getTime();
}

nList.prototype.createTableElement = function (id, style) {
    var table = document.createElement('table');
    table.id = id;
    table.className = "nList";

    if(style)
        table.className += ' ' + style;

    return table;
}

nList.prototype.appendTableToContainer = function (container, table) {
    container.append(table);
}

nList.prototype.appendColumnHeaders = function (table, columnHeaders) {
    if (columnHeaders == null || columnHeaders.length == 0)
        this.throwException("Columns not found");

    var tableHeader = document.createElement('thead');
    var tableHeaderRow = document.createElement('tr');

    for (var i = 0; i < columnHeaders.length; i++) {
        tableHeaderRow.append(this.createColumnHeader(columnHeaders[i]));
    }

    tableHeader.append(tableHeaderRow);
    table.append(tableHeader);
}

nList.prototype.createColumnHeader = function (columnDefinition) {
    var column = document.createElement('th');
    column.innerText = columnDefinition.text || '';

    if(columnDefinition.filterable){
        column.addEventListener('click', function(event){
            var table = event.currentTarget;
        });
    }

    return column;
}

nList.prototype.appendBody = function (table) {
    var tableBody = document.createElement('tbody');
    table.append(tableBody);
}

nList.prototype.appendFooter = function (table) {
    var tableFooter = document.createElement('tfoot');
    table.append(tableFooter);
}

nList.prototype.loadData = function (table, columns, data, pageSize, currentPage) {
    var tableBody = table.getElementsByTagName('tbody')[0]
    
    if(tableBody == null)
        this.throwException('Table body not found');

    for(var i = (currentPage - 1) * pageSize; i < ((currentPage - 1) * pageSize) + pageSize; i++){
        var tableRow = document.createElement('tr');

        for(var c = 0; c < columns.length; c++){
            var tableColumn = document.createElement('td');
            tableColumn.innerText = data[i][columns[c].id];
            tableRow.append(tableColumn);
        } 

        tableBody.append(tableRow);
    }
}
