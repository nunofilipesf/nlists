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
    this.loadData(this._options, this._dataSettings);
    this.renderPagination(this._options, this._dataSettings);
}

nList.prototype.setDefaultOptions = function (options) {
    if (options == null)
        options = {
            style: {}
        };

    options.pageSize = options.pageSize || 20;

    options.getNumberOfRecords = function () {
        if (this.numberOfRecords != null) {
            return typeof this.numberOfRecords === 'function' ? this.numberOfRecords() : this.numberOfRecords;
        }

        return this.data.length;
    };
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

    this.appendColumnHeaders(options.table, options.columns, options.style.header);
    this.appendBody(options.table, options.style.body);
    this.appendFooter(options.table, options.style.footer, options.style.information, options.style.pagination, options.style.paginationButton);
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

    if (style)
        table.className += ' ' + style;

    return table;
}

nList.prototype.appendTableToContainer = function (container, table) {
    container.append(table);
}

nList.prototype.appendColumnHeaders = function (table, columnHeaders, headerStyle) {
    if (columnHeaders == null || columnHeaders.length == 0)
        this.throwException("Columns not found");

    var tableHeader = document.createElement('thead');

    if (headerStyle)
        tableHeader.className += ' ' + headerStyle;

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

    if (columnDefinition.filterable) {
        column.addEventListener('click', function (event) {
            // Get nList data from th > tr > thead > table
            var columnInfo = event.currentTarget.nListColumn;

        });
    }

    return column;
}

nList.prototype.appendBody = function (table, bodyStyle) {
    var tableBody = document.createElement('tbody');

    if (bodyStyle)
        tableBody.className += ' ' + bodyStyle;

    table.append(tableBody);
}

nList.prototype.appendFooter = function (table, footerStyle, footerInfoStyle, footerPaginationStyle, footerPaginationButtonStyle) {
    var tableFooter = document.createElement('tfoot');
    var tableFooterRow = document.createElement('tr');
    var tableFooterInfoColumn = document.createElement('td');
    tableFooterInfoColumn.className = 'nList-information';
    var tableFooterPaginationColumn = document.createElement('td');
    tableFooterPaginationColumn.className = 'nList-pagination';

    if (footerStyle)
        tableFooter.className += ' ' + footerStyle;

    if (footerInfoStyle)
        tableFooterInfoColumn.className += ' ' + footerInfoStyle;

    if (footerPaginationStyle)
        tableFooterPaginationColumn.className += ' ' + footerPaginationStyle;

    tableFooterRow.append(tableFooterInfoColumn);
    tableFooterRow.append(tableFooterPaginationColumn);
    tableFooter.append(tableFooterRow);
    table.append(tableFooter);
}

nList.prototype.loadData = function (options, dataSettings) {
    if (typeof this._options.data === 'function') {
        this._options.data(options, dataSettings, this.renderData.bind(this));
    }
    else {
        this.renderData(this._options.data);
    }
}

nList.prototype.renderData = function (data) {
    var table = this._options.table;
    var columns = this._options.columns;
    var pageSize = this._options.pageSize;
    var currentPage = this._dataSettings.page;

    var tableBody = table.getElementsByTagName('tbody')[0]

    if (tableBody == null)
        this.throwException('Table body not found');

    tableBody.innerHTML = '';

    for (var i = (currentPage - 1) * pageSize; i < ((currentPage - 1) * pageSize) + pageSize; i++) {
        if (data[i] != null) {
            var tableRow = document.createElement('tr');

            for (var c = 0; c < columns.length; c++) {
                var tableColumn = document.createElement('td');
                tableColumn.innerText = data[i][columns[c].id];
                tableRow.append(tableColumn);
            }

            tableBody.append(tableRow);
        }
    }
}

nList.prototype.renderPagination = function (options, dataSettings) {
    var tableFooterPaginationColumn = options.table.getElementsByClassName('nList-pagination')[0];

    if (tableFooterPaginationColumn == null)
        this.throwException("Footer not found");

    var tableFooterPaginationPrevious = tableFooterPaginationColumn.getElementsByClassName('nList-pagination-previous')[0];
    if (tableFooterPaginationPrevious == null) {
        tableFooterPaginationPrevious = document.createElement('button');
        tableFooterPaginationPrevious.innerHTML = "&laquo;";
        tableFooterPaginationPrevious.className = "nList-pagination-previous";
        tableFooterPaginationPrevious.addEventListener('click', function (event) {
            nList.navigateToPage(-1);
        });

        if (options.style.paginationButton) {
            tableFooterPaginationPrevious.className += ' ' + options.style.paginationButton;
        }

        tableFooterPaginationColumn.append(tableFooterPaginationPrevious);
    }

    var tableFooterPaginationNext = tableFooterPaginationColumn.getElementsByClassName('nList-pagination-next')[0];
    if (tableFooterPaginationNext == null) {
        tableFooterPaginationNext = document.createElement('button');
        tableFooterPaginationNext.innerHTML = "&raquo;";
        tableFooterPaginationNext.className = "nList-pagination-next";
        tableFooterPaginationNext.addEventListener('click', function (event) {
            nList.navigateToPage(1);
        });

        if (options.style.paginationButton) {
            tableFooterPaginationNext.className += ' ' + options.style.paginationButton;
        }

        tableFooterPaginationColumn.append(tableFooterPaginationNext);
    }

    this.renderPaginationButtons(options, dataSettings, tableFooterPaginationColumn, tableFooterPaginationPrevious, tableFooterPaginationNext);
    this.disableNavigationButtons(dataSettings.page, dataSettings.numberOfPages, tableFooterPaginationPrevious, tableFooterPaginationNext);
}

nList.prototype.renderPaginationButtons = function (options, dataSettings, paginationContainer, previousButton, nextButton) {
    var currentPages = options.table.getElementsByClassName('nList-pagination-page');
    while (currentPages.length > 0) currentPages[0].remove();

    // Calculate the number of pages
    var numberOfRecordsDivisionByPage = options.getNumberOfRecords() / options.pageSize;
    var numberOfPages = Math.floor(numberOfRecordsDivisionByPage);
    numberOfPages = numberOfPages == 0 ? 1 : (numberOfRecordsDivisionByPage % 1 > 0) ? numberOfPages + 1 : numberOfPages;

    dataSettings.numberOfPages = numberOfPages;

    var currentPage = dataSettings.page;

    var firstPageToRender = currentPage - 2;
    firstPageToRender = firstPageToRender < 1 ? 1 : firstPageToRender;

    var lastPageToRender = currentPage + 2;
    lastPageToRender = lastPageToRender > numberOfPages ? numberOfPages : lastPageToRender;

    if(firstPageToRender == 1)
        lastPageToRender = firstPageToRender + 4;
    if(lastPageToRender == numberOfPages)
        firstPageToRender = lastPageToRender - 4;

    // Render the page buttons
    for (var i = firstPageToRender; i <= lastPageToRender; i++) {
        var page = i;
        var tableFooterPaginationPage = document.createElement('button');
        tableFooterPaginationPage.innerText = page;
        tableFooterPaginationPage.className = "nList-pagination-page";
        tableFooterPaginationPage.pageNumber = page;
        tableFooterPaginationPage.addEventListener('click', function (event) {
            nList.goToPage(event.currentTarget.pageNumber);
        });

        if (options.style.paginationButton) {
            tableFooterPaginationPage.className += ' ' + options.style.paginationButton;
        }

        // If the buttons corresponds to the current page, disable it
        if (dataSettings.page == page) {
            tableFooterPaginationPage.setAttribute('disabled', '');
            tableFooterPaginationPage.className += ' ' + 'nList-paginationButton-inactive';
        }

        paginationContainer.insertBefore(tableFooterPaginationPage, nextButton);
    }
}

nList.prototype.disableNavigationButtons = function (currentPage, numberOfPages, previousButton, nextButton) {
    if (currentPage == 1) {
        previousButton.setAttribute('disabled', '');
        previousButton.classList.add('nList-paginationButton-inactive');
    }
    else {
        previousButton.hasAttribute('disabled') && previousButton.removeAttribute('disabled');
        previousButton.classList.contains('nList-paginationButton-inactive') && previousButton.classList.remove('nList-paginationButton-inactive');
    }

    if (currentPage == numberOfPages) {
        nextButton.setAttribute('disabled', '');
        nextButton.classList.add('nList-paginationButton-inactive');
    }
    else {
        nextButton.hasAttribute('disabled') && nextButton.removeAttribute('disabled');
        nextButton.classList.contains('nList-paginationButton-inactive') && nextButton.classList.remove('nList-paginationButton-inactive');
    }
}

// Navigation
nList.prototype.navigateToPage = function (pageNavigationValue) {
    this._dataSettings.page += pageNavigationValue;
    this.loadData(this.options, this._dataSettings);
    this.renderPagination(this._options, this._dataSettings);
}

nList.prototype.goToPage = function (pageValue) {
    this._dataSettings.page = pageValue;
    this.loadData(this.options, this._dataSettings);
    this.renderPagination(this._options, this._dataSettings);
}
