function today() {
    var date = new Date();
    return format(date);
}

function yesterday() {
    var date = new Date(Date.now() - 86400000);
    return format(date);
}

function format(date){
    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day;

}

module.exports = {
 yesterday: yesterday,
 today: today,
}
