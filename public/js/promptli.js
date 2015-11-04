/**
 * Test Harness Javascript.
 */
$(document).ready(function() {
    $("#sdk-authenticate").click(function() {
        $.post("/login", function (data, status) {
            var s = '';
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    s += '['+key+'='+data[key]+']\n';
                }
            }
            s += '[status='+status+']\n';
            alert(s);
        }, "json")
            .fail(function (jqXHR, status, error) {
                alert("Failed! "+error);
            })
    });
});


