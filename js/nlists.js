"use strict";

var nList = function (options) {

    this._options = options;
    this._dataSettings = {
        page: 1,
        sorting: [],
        filters: {}
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

    options.pagination = options.pagination || 'full';
    options.pageSize = options.pageSize || 20;
    options.language = (options.language || 'default').toLowerCase();

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
    this.appendFooter(options.table, options.columns.length, options.style.footer, options.style.information, options.style.pagination, options.style.paginationButton, options.pagination);
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
    container.appendChild(table);
}

nList.prototype.appendColumnHeaders = function (table, columnHeaders, headerStyle) {
    if (columnHeaders == null || columnHeaders.length == 0)
        this.throwException("Columns not found");

    var tableHeader = document.createElement('thead');

    if (headerStyle)
        tableHeader.className += ' ' + headerStyle;

    var tableHeaderRow = document.createElement('tr');

    for (var i = 0; i < columnHeaders.length; i++) {
        tableHeaderRow.appendChild(this.createColumnHeader(table.id, columnHeaders[i]));
    }

    tableHeader.appendChild(tableHeaderRow);
    table.appendChild(tableHeader);
}

nList.prototype.createColumnHeader = function (tableid, columnDefinition) {
    var column = document.createElement('th');
    column.id = tableid + '_' + columnDefinition.id;
    column.innerHTML = columnDefinition.text || '';
    column.nListColumn = columnDefinition;

    column.className = columnDefinition.style || '';
    if (columnDefinition.width != null && columnDefinition.width !== '')
        column.style.width = columnDefinition.width;

    if (columnDefinition.sortable) {
        column.classList.add('nList-sortable');
        column.innerHTML += '<span style="visibility: hidden" class="nList-sorting">&#9650;</span>'

        column.addEventListener('click', function (event) {
            var columnInfo = event.currentTarget.nListColumn;

            //                    th            tr            thead         table
            var tableList = event.currentTarget.parentElement.parentElement.parentElement.nList;

            columnInfo.sortType = tableList.getNextSortType(columnInfo.sortType);
            tableList.sortBy(columnInfo.id, columnInfo.sortType, event.currentTarget);
        });
    }

    return column;
}

nList.prototype.appendBody = function (table, bodyStyle) {
    var tableBody = document.createElement('tbody');

    if (bodyStyle)
        tableBody.className += ' ' + bodyStyle;

    table.appendChild(tableBody);
}

nList.prototype.appendFooter = function (table, numberOfColumns, footerStyle, footerInfoStyle, footerPaginationStyle, footerPaginationButtonStyle, pagination) {
    if (pagination != null && pagination !== 'none') {
        var tableFooter = document.createElement('tfoot');
        var tableFooterRow = document.createElement('tr');

        // var numberOfColumnsDivision = numberOfColumns / 2;
        // var tableFooterInfoColumn = document.createElement('td');
        // tableFooterInfoColumn.className = 'nList-information';
        // tableFooterInfoColumn.setAttribute('colspan', Math.floor(numberOfColumnsDivision));
        var tableFooterPaginationColumn = document.createElement('td');
        tableFooterPaginationColumn.className = 'nList-pagination';
        //tableFooterPaginationColumn.setAttribute('colspan', numberOfColumns - Math.floor(numberOfColumnsDivision));
        tableFooterPaginationColumn.setAttribute('colspan', numberOfColumns);

        if (footerStyle)
            tableFooter.className += ' ' + footerStyle;

        if (footerInfoStyle)
            tableFooterInfoColumn.className += ' ' + footerInfoStyle;

        if (footerPaginationStyle)
            tableFooterPaginationColumn.className += ' ' + footerPaginationStyle;

        //tableFooterRow.appendChild(tableFooterInfoColumn);
        tableFooterRow.appendChild(tableFooterPaginationColumn);
        tableFooter.appendChild(tableFooterRow);
        table.appendChild(tableFooter);
    }
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

    var dataToRender = data.slice();

    if (pageSize === -1) {
        var startAt = 0;
        var endAt = dataToRender.length;
    }
    else {
        var startAt = (currentPage - 1) * pageSize;
        var endAt = ((currentPage - 1) * pageSize) + pageSize;
    }

    if (this._options.serverSideProcessing === true) {
        startAt = 0;
        endAt = pageSize;
    }
    else {
        dataToRender = this.sortValues(dataToRender, this._dataSettings.sorting);
        dataToRender = this.filterValues(dataToRender, columns, this._dataSettings.filters);
    }


    if (dataToRender.length == 0) {
        var tableRow = document.createElement('tr');
        var tableColumn = document.createElement('td'); tableColumn.colSpan = columns.length;

        tableColumn.innerText = this.getText('NoRecords');
        tableColumn.style.textAlign = 'center';

        tableRow.appendChild(tableColumn);
        tableBody.appendChild(tableRow);
    }
    else {
        for (var i = startAt; i < endAt; i++) {
            if (dataToRender[i] != null) {
                var tableRow = document.createElement('tr');

                for (var c = 0; c < columns.length; c++) {
                    var tableColumn = document.createElement('td');
                    if (columns[c].html === true)
                        tableColumn.innerHTML = dataToRender[i][columns[c].id];
                    else
                        tableColumn.innerText = dataToRender[i][columns[c].id];

                    tableColumn.className = columns[c].style || '';
                    if (columns[c].width != null && columns[c].width !== '')
                        tableColumn.style.width = columns[c].width;

                    tableRow.appendChild(tableColumn);
                }

                tableBody.appendChild(tableRow);
            }
        }
    }

    this.renderPagination(this._options, this._dataSettings);
}

nList.prototype.renderPagination = function (options, dataSettings) {
    if (options.pagination != null && options.pagination !== 'none') {
        var tableFooterPaginationColumn = options.table.getElementsByClassName('nList-pagination')[0];

        if (tableFooterPaginationColumn == null)
            this.throwException("Footer not found");

        var tableFooterPaginationPrevious = tableFooterPaginationColumn.getElementsByClassName('nList-pagination-previous')[0];
        if (tableFooterPaginationPrevious == null) {
            tableFooterPaginationPrevious = document.createElement('button');
            tableFooterPaginationPrevious.innerHTML = "&laquo;";
            tableFooterPaginationPrevious.className = "nList-pagination-previous";
            tableFooterPaginationPrevious.addEventListener('click', function (event) {
                //                    button        td            tr            thead         table
                var tableList = event.currentTarget.parentElement.parentElement.parentElement.parentElement.nList;

                tableList.navigateToPage(-1);
            });

            if (options.style.paginationButton) {
                tableFooterPaginationPrevious.className += ' ' + options.style.paginationButton;
            }

            tableFooterPaginationColumn.appendChild(tableFooterPaginationPrevious);
        }

        var tableFooterPaginationNext = tableFooterPaginationColumn.getElementsByClassName('nList-pagination-next')[0];
        if (tableFooterPaginationNext == null) {
            tableFooterPaginationNext = document.createElement('button');
            tableFooterPaginationNext.innerHTML = "&raquo;";
            tableFooterPaginationNext.className = "nList-pagination-next";
            tableFooterPaginationNext.addEventListener('click', function (event) {
                //                    button        td            tr            thead         table
                var tableList = event.currentTarget.parentElement.parentElement.parentElement.parentElement.nList;
                tableList.navigateToPage(1);
            });

            if (options.style.paginationButton) {
                tableFooterPaginationNext.className += ' ' + options.style.paginationButton;
            }

            tableFooterPaginationColumn.appendChild(tableFooterPaginationNext);
        }

        this.renderPaginationButtons(options, dataSettings, tableFooterPaginationColumn, tableFooterPaginationPrevious, tableFooterPaginationNext);

        this.disableNavigationButtons(dataSettings.page, dataSettings.numberOfPages, tableFooterPaginationPrevious, tableFooterPaginationNext);
    }
}

nList.prototype.renderPaginationButtons = function (options, dataSettings, paginationContainer, previousButton, nextButton) {
    var currentPages = options.table.getElementsByClassName('nList-pagination-page');
    while (currentPages.length > 0) currentPages[0].parentElement.removeChild(currentPages[0]);

    // Calculate the number of pages
    var numberOfRecordsDivisionByPage = options.getNumberOfRecords() / options.pageSize;
    var numberOfPages = Math.floor(numberOfRecordsDivisionByPage);
    numberOfPages = numberOfPages == 0 ? 1 : (numberOfRecordsDivisionByPage % 1 > 0) ? numberOfPages + 1 : numberOfPages;

    dataSettings.numberOfPages = numberOfPages;

    if (options.pagination === 'full') {
        var currentPage = dataSettings.page;

        var firstPageToRender = currentPage - 2;
        firstPageToRender = firstPageToRender < 1 ? 1 : firstPageToRender;

        var lastPageToRender = currentPage + 2;

        if (firstPageToRender == 1)
            lastPageToRender = firstPageToRender + 4;
        if (lastPageToRender == numberOfPages)
            firstPageToRender = lastPageToRender - 4;

        lastPageToRender = lastPageToRender > numberOfPages ? numberOfPages : lastPageToRender;

        // Render the page buttons
        for (var i = firstPageToRender; i <= lastPageToRender; i++) {
            var page = i;
            var tableFooterPaginationPage = document.createElement('button');
            tableFooterPaginationPage.innerText = page;
            tableFooterPaginationPage.className = "nList-pagination-page";
            tableFooterPaginationPage.pageNumber = page;
            tableFooterPaginationPage.addEventListener('click', function (event) {
                //                    button        td            tr            tfoot         table
                var tableList = event.currentTarget.parentElement.parentElement.parentElement.parentElement.nList;
                tableList.goToPage(event.currentTarget.pageNumber);
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
    this.loadData(this._options, this._dataSettings);
}

nList.prototype.goToPage = function (pageValue) {
    this._dataSettings.page = pageValue;
    this.loadData(this._options, this._dataSettings);
}

// Sorting
nList.prototype.getNextSortType = function (currentSortType) {
    if (currentSortType == null || currentSortType === '')
        return 'asc';

    if (currentSortType === 'asc')
        return 'desc';

    if (currentSortType === 'desc')
        return '';
}

nList.prototype.sortBy = function (column, sortType, domColumn) {
    if (this._options.multipleSorting === true) {
        var currentFilterToColumnIndex = -1;
        for (var i = 0; i < this._dataSettings.sorting.length; i++) {
            if (this._dataSettings.sorting[i].column == column)
                currentFilterToColumnIndex = i;
        }

        if ((sortType == null || sortType === '') && currentFilterToColumnIndex > -1) {
            // Remove from sorting array
            this._dataSettings.sorting.splice(currentFilterToColumnIndex, 1);
        }
        else {
            if (currentFilterToColumnIndex > -1)
                this._dataSettings.sorting[currentFilterToColumnIndex].type = sortType;
            else
                // Add to sorting array
                this._dataSettings.sorting.push({ column: column, type: sortType });
        }
    }
    else {
        for (var i = 0; i < this._dataSettings.sorting.length; i++) {
            var sortingColumn = this._dataSettings.sorting[i];
            var sortingColumnDomElement = document.getElementById(this._options.id + '_' + sortingColumn.column);
            sortingColumnDomElement.nListColumn.sortType = '';
            this.applySortSymbolToColumn(sortingColumnDomElement, '');
        }

        // Add to sorting array
        this._dataSettings.sorting = [{ column: column, type: sortType }];
    }

    this.applySortSymbolToColumn(domColumn, sortType);

    this._dataSettings.page = 1;
    this.loadData(this._options, this._dataSettings);
}

nList.prototype.applySortSymbolToColumn = function (domColumn, sortType) {
    var sortSymbol = '';

    if (sortType === 'desc')
        sortSymbol = '&#9660;';
    else
        if (sortType === 'asc')
            sortSymbol = '&#9650;';

    var sortingSymbolContainer = domColumn.getElementsByClassName('nList-sorting')[0];
    if (sortingSymbolContainer != null) {
        sortingSymbolContainer.innerHTML = sortSymbol;
        if (sortSymbol !== '')
            sortingSymbolContainer.style.visibility = '';
        else {
            sortingSymbolContainer.style.visibility = 'hidden';
            sortingSymbolContainer.innerHTML = '&#9650;';
        }
    }
}

nList.prototype.sortValues = function (values, sortingDefinition) {
    if (sortingDefinition == null || sortingDefinition.length == 0)
        return values;

    var sortingOptions = [];
    for (var i = 0; i < this._dataSettings.sorting.length; i++) {
        if (this._dataSettings.sorting[i].type === 'desc')
            sortingOptions.push('-' + this._dataSettings.sorting[i].column);
        else
            sortingOptions.push(this._dataSettings.sorting[i].column);
    }

    return values.sort(nList.fieldSorter(sortingOptions));
}

nList.fieldSorter = function (fields) {
    return function (a, b) {
        return fields
            .map(function (o) {
                var dir = 1;
                if (o[0] === '-') {
                    dir = -1;
                    o = o.substring(1);
                }
                if (a[o] > b[o]) return dir;
                if (a[o] < b[o]) return -(dir);
                return 0;
            })
            .reduce(function (p, n) {
                return p ? p : n;
            }, 0);
    };
}

// Filtering
nList.prototype.applyFilter = function (column, comparisionType, comparisionValue) {
    var listColumn;
    for (var i = 0; i < this._options.columns.length; i++) {
        if (this._options.columns[i].id == column) {
            listColumn = this._options.columns[i];
            break;
        }
    }

    this._dataSettings.filters[listColumn.id] = { type: comparisionType, value: comparisionValue };

    this._dataSettings.page = 1;
    this.loadData(this._options, this._dataSettings);
}

nList.prototype.removeFilter = function (column) {
    if (this._dataSettings.filters[column])
        delete this._dataSettings.filters[column];

    this._dataSettings.page = 1;
    this.loadData(this._options, this._dataSettings);
}

nList.comparisionFunctions = {
    // Equal
    'eq': function (a, b) {
        return a === b;
    },
    // Greater than
    'gt': function (a, b) {
        return a > b;
    },

    // Greater than or equal
    'ge': function (a, b) {
        return a >= b;
    },

    // Less than
    'lt': function (a, b) {
        return a < b;
    },

    // Less than or equal
    'le': function (a, b) {
        return a <= b;
    },

    // Contains (strings only)
    'ct': function (a, b) {
        return String(a).indexOf(String(b)) != -1;
    },

    // Starts with (strings only)
    'sw': function (a, b) {
        return String(a).startsWith(String(b));
    },

    // Ends with (strings only)
    'ew': function (a, b) {
        return String(a).endsWith(String(b));
    },
}

nList.prototype.filterValues = function (values, columns, filterDefinition) {
    var filteredValues = [];
    for (var i = 0; i < values.length; i++) {
        if (this.isValidWithFilters(values[i], columns, filterDefinition)) {
            filteredValues.push(values[i]);
        }
    }
    return filteredValues;
}

nList.prototype.isValidWithFilters = function (row, columns, filterDefinition) {
    for (var c = 0; c < columns.length; c++) {
        var column = columns[c].id;
        var columnFilter = filterDefinition[column];
        if (columnFilter && nList.comparisionFunctions[columnFilter.type]) {
            if (!nList.comparisionFunctions[columnFilter.type](row[column], columnFilter.value))
                return false;
        }
    }

    return true;
}

/* Language defaults */
nList.languages = {
    'default': {
        NoRecords: 'No records found'
    }
};

nList.prototype.getText = function (textCode) {
    if (this._options.language == null || this._options.language === '')
        this._options.language = 'default';

    if (nList.languages[this._options.language] == null) {
        console.warn('Language not found. Default will be used');
        this._options.language = 'default';
    }

    if (nList.languages[this._options.language][textCode])
        return nList.languages[this._options.language][textCode];

    return '';
}
