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
    this.loadData(  this._options, 
                    this._dataSettings );
    

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
    options.table.nList = this;

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

// HTML Render
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
    column.nListColumn = columnDefinition;

    if(columnDefinition.filterable){
        column.addEventListener('click', function(event){
            // Get nList data from th > tr > thead > table
            var columnInfo = event.currentTarget.nListColumn;
            
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
    var tableFooterRow = document.createElement('tr');
    var tableFooterInfoColumn = document.createElement('td');
    var tableFooterPaginationColumn = document.createElement('td');

    var tableFooterPaginationPrevious = document.createElement('button');
    tableFooterPaginationPrevious.innerText = "Previous";
    tableFooterPaginationPrevious.addEventListener('click', function(event){
        nList.navigateToPage(-1);
    });

    var tableFooterPaginationNext = document.createElement('button');
    tableFooterPaginationNext.innerText = "Next";
    tableFooterPaginationNext.addEventListener('click', function(event){
        nList.navigateToPage(1);
    });

    tableFooterPaginationColumn.append(tableFooterPaginationPrevious);
    tableFooterPaginationColumn.append(tableFooterPaginationNext);
    tableFooterRow.append(tableFooterInfoColumn);
    tableFooterRow.append(tableFooterPaginationColumn);
    tableFooter.append(tableFooterRow);
    table.append(tableFooter);
}

nList.prototype.loadData = function (options, dataSettings) {
    if(typeof this._options.data === 'function'){
        this._options.data(options, dataSettings, this.renderData.bind(this));
    }
    else{
        this.renderData(this._options.data);
    }
}

nList.prototype.renderData = function(data){
    var table = this._options.table;
    var columns = this._options.columns;
    var pageSize = this._options.pageSize;
    var currentPage = this._dataSettings.page;

    var tableBody = table.getElementsByTagName('tbody')[0]
    
    if(tableBody == null)
        this.throwException('Table body not found');

    tableBody.innerHTML = '';

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

// Navigation
nList.prototype.navigateToPage= function(pageNavigationValue){
    this._dataSettings.page += pageNavigationValue;
    this.loadData(  this.options, 
                    this._dataSettings );
}