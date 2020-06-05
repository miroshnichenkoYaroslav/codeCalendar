/**
 * Associates each table with a plugin tableCellSelection.
 * Multiple selection of cells will now be available.
 */
function initTableCellData() {
    $.each(tables, function (index, table) {
        $(table).tableCellsSelection('init');
    });
}

/**
 * Gets data for selected cells and writes to window object.
 *
 * @param tableID
 */
function getSelectedCellData(tableID) {
    return $(tableID).tableCellsSelection('selectedCells');
}