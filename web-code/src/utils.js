




export const format_persentage = (num) => {
    return num / 10 + '%';
}

export const format_persentage_tofixed = (num) => {
    return (num / 10).toFixed(1) + '%';
}

export const format_balance = (numStr, decimals, decimalPlace = decimals) => {
    numStr = numStr.toLocaleString().replace(/,/g, '');
    // decimals = decimals.toString();
    var str = (10 ** decimals).toLocaleString().replace(/,/g, '').slice(1);
    var res = (numStr.length > decimals ?
        numStr.slice(0, numStr.length - decimals) + '.' + numStr.slice(numStr.length - decimals) :
        '0.' + str.slice(0, str.length - numStr.length) + numStr).replace(/(0+)$/g, "");
    res = res.slice(-1) === '.' ? res + '00' : res;
    if (decimalPlace === 0)
        return res.slice(0, res.indexOf('.'));
    var length = res.indexOf('.') + 1 + decimalPlace;
    return res.slice(0, length >= res.length ? res.length : length);
    // return res.slice(-1) == '.' ? res + '00' : res;
}

export const format_str_to_K = (str_num) => {
    var reg = /\d{1,3}(?=(\d{3})+$)/g;

    // if (str_num.indexOf('.') > 0) {
    //   str_num = str_num.slice(0, str_num.indexOf('.') + 3);
    // }

    if (str_num.indexOf('.') > 0) {
        var part_a = str_num.split('.')[0];
        var part_b = str_num.split('.')[1];
        part_a = (part_a + '').replace(reg, '$&,');
        return part_a + '.' + part_b;
    } else {
        str_num = (str_num + '').replace(reg, '$&,');
        return str_num;
    }
}