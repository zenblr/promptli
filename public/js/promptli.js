/**
 * Test Harness Javascript.
 */

var sdk = {
    'v1':{'domain':'volume.timeli.io', sdk:{}},
    'v2':{'domain':'volume.timeli-staging.com', sdk:{}}
}

var g = {};
var current_version = null;
var in_regression_mode = false;
var in_recording_mode = false;
var recorded_script = [];
var recorded_results = [];
var playback_results = [];

$(document).ready(function() {

    var z = getResources(APP.SDK);
    z.forEach(function(v){
        $('.resources').append($('<option>', {
            value: v,
            text: v
        }));
    });
    $('.version').change(function() {
        var v = $(this).val();
        in_regression_mode = false;
        if ((v != 0) && (v != 'a')) {
            if (current_version != v) {
                login(v);
                logMsg("INFO", "Switching to version '"+v+"'");
            }
        }
        else if (v == 'a') {
            in_regression_mode = true;
            logMsg("INFO", 'Switching to regression mode testing');
            for (var ver in sdk) {
                if (sdk.hasOwnProperty(ver)) {
                    login(ver);
                }
            }
        }
    });

    $('.resources').change(function() {
        $(".methods").empty();
        $('.methods').append($('<option>', {
            value: '0',
            text: 'Select Method'
        }));
        var res = getSelectedResource($(this).val());
        for (var n in res) {
            if ((res.hasOwnProperty(n)) &&  (typeof(res[n]) == "function")) {
                $('.methods').append($('<option>', {
                    value: n,
                    text: n
                }));
            };
        }
    });

    $('.methods').change(function() {
        var method = $(this).val();
        if (method == '0') {
            return;
        }
        var resource = $('.resources').val();
        var res = getSelectedResource(resource);
        var args = getFunctionArguments(res[method]);
        if (args.length > 0) {
            $('.params').empty();
            var prefix = resource + '_' + method + '_';
            for (var i = 0; i < args.length; i++) {
                if (args[i] == 'cb') {
                    continue;
                }
                var name = prefix + args[i];
                $('.params').append($('<label for="' + name + '">' + args[i] + '</label>'));
                $('.params').append($('<input type="text" value="" name="' + name + '">'));
                if ((in_recording_mode) && (recorded_results.length > 0)) {
                    $('.params').append($('<a class="select-value">[select]</a>'));
                }
                $('.params').append($('<br>'));
            }
            $('.params .select-value').click(function() {
               popupRecordedResults($(this).prev());
            });
            $('.code-box').hide();
            $('.go-box').show();
        }
    });


    $('.code-button').click(function() {
        $('.go-box').hide();
        $('.code-box').show();
    });

    $('.clear-button').click(function() {
        $('textarea[name=code]').val('');
    });

    $('.close-button').click(function() {
        $('.code-box, .go-box').hide();
    });

    $('.save-button').click(function() {
        var ele = $('div.save').clone();
        ele.find('.popupsave').click(function() {
            var name = ele.find('input[name=name]').val();
            var content = $('textarea[name=code]').val();
            $.post("/save", {name:name, content:content}, function(resp) {
                if (resp.status == "success") {
                    ele.find('input').remove();
                    ele.find('.popupsave').remove();
                    ele.append("<p>Your test script has been saved as: '"+name+"'");
                    logMsg("INFO", "Test script saved as: '"+name+"'");
                }
            }, "json");
        })
        showPopup(ele);
    });

    $('.get-button').click(function() {
        var ele = $('div.get').clone();
        ele.find('.popupget').click(function() {
            var name = ele.find('input[name=name]').val();
            $.get("/get", {name:name}, function(resp) {
                if (resp.status == "success") {
                    if (resp.content_type && (resp.content_type == "array")) {
                        $('textarea[name=code]').val(JSON.stringify(resp.content));
                    }
                    else {
                        $('textarea[name=code]').val(resp.content);
                    }
                    ele.find('input').remove();
                    ele.find('.popupget').remove();
                    ele.append("<p>Your test script '"+name+"' has been fetched.");
                    logMsg("INFO", "Test script '"+name+"' loaded.");
                }
            }, "json");
        })
        showPopup(ele);
    });

    $('.run-button').click(function() {
        var text = $('textarea[name=code]').val().trim();
        executeTextScript(text);
        //getAndRunScript(text);
        /*var versions = getVersionsToTest();
        if (versions == null) {
            return;
        }
        if ($('input[name=script_name_for_code]').val() != '') {
            logMsg("INFO", "Running script '"+$('input[name=script_name_for_code]').val()+"'...");
        }
        $('input[name=script_name_for_code]').val('');
        var cmds;
        var text = $('textarea[name=code]').val().trim();
        if ((text.charAt(0) == '[') &&  (text.charAt(text.length -1) == ']')) {
            cmds = JSON.parse(text);
            cmds.reverse();
            runScriptArray(versions, cmds);
        }
        else {
            try {
                cmds = eval('[' + text + ']');
            }
            catch (error) {
                logMsg("ERROR", error.message);
                return;
            }
            cmds.reverse();
            if (cmds.length > 0) {
                execute(versions, cmds, true, function(results) {
                    evaluateResults(results);
                });
            }
        }*/
    });

    $('.go-button').click(function() {
        if ($('.show-box').find('.pin-control').hasClass('unpinned')) {
            $('.show-box').hide();
        }
        var vals = [];
        $('.go-box input').each(function() {
            var val = $(this).val().trim();
            if (val != '') {
                vals.push((val.charAt(0) == '{' ? JSON.parse(val) : val));
            }
        });

        var versions = getVersionsToTest();
        if (versions == null) {
            return;
        }
        if (in_recording_mode) {
            vals = do_record($('.resources').val(),$('.methods').val(), vals);
        }
        playback_results = [];
        execute(versions, vals, false, function(results) {
            evaluateResults(results);
        });

    });




    $('.clear-transcript').click(function() {
        $('#log').empty().append('<p align="left"></p>');
    });

    /*$('input[name=mode]').change(function() {
        if ($(this).is(':checked')) {
            in_regression_mode = true;
            logMsg("INFO", 'Switching to regression mode testing');
            $(".version").val('a');
            for (var ver in sdk) {
                if (sdk.hasOwnProperty(ver)) {
                    login(ver);
                }
            }
        }
        else {
            in_regression_mode = false;
            $(".version").val(current_version);
            logMsg("INFO", 'Switching to regular mode testing with version: '+current_version);
        }
    });*/

    $("input[name=command]").keyup(function(e) {
        if (e.keyCode == 13) {
            logMsg("INFO", $(this).val());
        }
    });

    $(".recording:not(.roundbutton)").click(function() {
        var not_recording = !!$('.recording:not(.roundbutton)').text().match(/Start/);

        if (not_recording) {
            $('.recording.roundbutton').css('background-color','red');
            $('.recording:not(.roundbutton)').text("Stop Recording");
            in_recording_mode = true;
        }
        else {
            $('.recording.roundbutton').css('background-color','white');
            $('.recording:not(.roundbutton)').text("Start Recording");
            in_recording_mode = false;

        }
    });

    $(".reset-recording").click(function() {
        recorded_script = [];
        recorded_results = [];
        logMsg("INFO", "Recording has been reset.")
    });

    $(".save-recording").click(function() {
        if (recorded_script.length > 0) {
            var ele = $('div.save').clone();
            ele.find('.popupsave').click(function() {
                var name = ele.find('input[name=name]').val();
                var desc = ele.find('textarea[name=description]').val();
                var content = JSON.stringify(recorded_script);
                $.post("/save", {name:name, description:desc, content:content, content_type:"array"}, function(resp) {
                    if (resp.status == "success") {
                        ele.find('input').remove();
                        ele.find('textarea').remove();
                        ele.find('.popupsave').remove();
                        ele.prepend("<p>Your test script has been saved as: '"+name+"'</p>");
                        logMsg("INFO", "Test script saved as: '"+name+"'");
                    }
                }, "json");
            });
            showPopup(ele);
        }
        else {
            showPopup($("<p>No recording to save</p>"));
        }
    });

    $(".run-recording").click(function() {
        var ele = $('div.get').clone();
        ele.find('.popupget').text("Run");
        ele.append($('div.list-of-scripts').clone());
        ele.find('.list-of-scripts table').hide();
        ele.find('.all-scripts').click(function() {
            var _this = $(this);
            $.get("/get_all", {}, function(resp) {
                if (resp.status == "success") {
                    resp.scripts.forEach(function(s) {
                        var row = '<td>'+'<a class="script-name">'+s.name+'</a></td><td>'+ s.description+'</td>';
                        _this.parent().next().append('<tr>'+row+'</tr>');
                    });
                    _this.parent().next().find('.script-name').click(function() {
                       getAndRunScript($(this).text());
                       hidePopup();
                    });
                    _this.parent().next().show();
                }
            }, "json");
        });
        ele.find('.popupget').click(function() {
            var name = ele.find('input[name=name]').val();
            getAndRunScript(name);
            hidePopup();
            /*$.get("/get", {name:name}, function(resp) {
                if (resp.status == "success") {
                    var full_script;
                    if (resp.content_type && (resp.content_type == "array")) {
                        full_script = JSON.stringify(resp.content);
                    }
                    else {
                        full_script = resp.content;
                    }
                    $('textarea[name=code]').val('');
                    $('textarea[name=code]').val(full_script);
                    $('input[name=script_name_for_code]').val(name);
                    hidePopup();
                    $('.run-button').trigger("click");

                }
            }, "json");*/
        });
        showPopup(ele, {width:700});
    });

    $('.pin-control').click(function() {
       if ($(this).hasClass('pinned')) {
            $(this).removeClass('pinned').addClass('unpinned');
            $(this).find('.pin').text('P');
       }
        else {
           $(this).removeClass('unpinned').addClass('pinned');
           $(this).find('.pin').text('U');
       }
    });

    showPopup($('<p>Please select version of system to test, or choose regression mode, before any other action.</p>'));

});

function getAndRunScript(name) {
    $.get("/get", {name:name}, function(resp) {
        if (resp.status == "success") {
            var script;
            if (resp.content_type && (resp.content_type == "array")) {
                script = JSON.stringify(resp.content);
            }
            else {
                script = resp.content;
            }
            logMsg("INFO", "Running script '"+name+"'...");
            executeTextScript(script);
        }
    }, "json");
}

function executeTextScript(text) {
    if (in_recording_mode) {
        $(".recording:not(.roundbutton)").trigger("click");
    }
    playback_results = [];
    var versions = getVersionsToTest();
    if (versions == null) {
        return;
    }
    var cmds;
    if ((text.charAt(0) == '[') &&  (text.charAt(text.length -1) == ']')) {
        cmds = JSON.parse(text);
        cmds.reverse();
        runScriptArray(versions, cmds);
    }
    else {
        try {
            cmds = eval('[' + text + ']');
        }
        catch (error) {
            logMsg("ERROR", error.message);
            return;
        }
        cmds.reverse();
        if (cmds.length > 0) {
            execute(versions, cmds, true, function(results) {
                evaluateResults(results);
            });
        }
    }
}

function getVersionsToTest() {
    var versions =  [];
    if (in_regression_mode) {
        for (var ver in sdk) {
            if (sdk.hasOwnProperty(ver)) {
                versions.push(ver);
            }
        }
    }
    else {
        if (current_version != null) {
            versions.push(current_version);
        }
    }
    if (versions.length == 0) {
        logMsg("ERROR", "No versions selected!");
        return null;
    }
    return versions;
}


function getSelectedResource(resource, ver) {
    ver = ver || current_version;
    if (ver == null) {
        return null;
    }
    var name = "sdk['"+ver+"'].sdk.APP.SDK";
    var objs = resource.split('.');
    for (var i = 0; i < objs.length; i++) {
        name += '["' + objs[i] + '"]';
    }
    return eval(name);
}


function logMsg(type, str) {
    switch(type.toUpperCase()) {
        case "INFO":
            str = '[INFO] '+str+'<br>';
            break;
        case "RESULT":
            addEmptyLine();
            str = str +'<br>';
            break;
        case "ERROR":
            addEmptyLine();
            str = '<p align="left" style="color:red">'+'[ERROR] '+str+'</p><br>';
            addEmptyLine();
            break;
        case "START":
            addEmptyLine();
            str = str;
            break;
        case "CONTINUE":
            break;
        case "END":
            str = str +"<br>";
            break;
        default: break;
    }
    $("#log p:last-child").html($("#log p:last-child").html()+str);
    scroll();
}

function addEmptyLine() {
    $("#log").append('<p align="left"></p>');
}

function scroll(){
    var d = document.getElementById("log");
    d.scrollTop = d.scrollHeight;
}

// Credit: http://jsfiddle.net/jstoolsmith/ntFST/

function getFunctionArguments(f) {
    var argRE = /^\s*function\s+(?:\w*\s*)?\((.*?)\)/;
    var m = f.toString().match(argRE);
    if ((m != null) && (m.length > 1)) {
        return m[1].trim().split(/\s*,\s*/);
    }
    return [];
}

function generalcb(e, r) {
    if (e == null) {
        logMsg("RESULT", JSON.stringify(r));
    }
    else {
        logMsg("ERROR", JSON.stringify(e));
    }
}



$(document).ajaxStart(function () {
    $('#busy').show();
});

$(document).ajaxStop(function () {
    $('#busy').hide();
});


function hidePopup() {
    $.colorbox.close();
}

function showPopup(ele, opt) {
    if (!ele) {
        return;
    }

    ele.find('.xbutton').click(function() {
        $.colorbox.close();
    });

    var width = opt && opt.width ? opt.width : 500;
    var height = opt && opt.height ? opt.height : 200;

    $.colorbox({
        html: ele,
        width: width,
        height: height
    });
}

function run(sdk, code, cb) {

    var p =  new Promise(

        function(resolve, reject) {

            var strargs  = '',
                resource = sdk,
                method   = '';

            var resource_name = '';

            var z = code.match(/\((.*)\)/);

            if (z != null) {
                strargs  = z[1];
            }

            code = code.replace(/\(.*\)/, '');

            z = code.match(/(\w+)/g);

            if (z != null) {
                for (var i=0; i<z.length -1; i++) {
                    resource = resource[z[i]];
                    resource_name += z[i] + '.';
                }
                resource_name.replace(/\.$/,'');
                method  = z[z.length-1];
            }
            else {
                reject(new Error("cannot parse statement"));
            }

            if (typeof(resource) != 'object') {
                reject(new Error('unrecognized resource type "' + resource_name + '"'));
            }

            if (typeof(resource[method]) != 'function') {
                reject(new Error('method "' + method + '" does not exist for resource "' + resource_name + '"'));
            }

            try {
                strargs = fixArgumentReferences(strargs);
            }
            catch (err) {
                reject(err);
            }

            var args = [];

            try {
                args = eval('[' + strargs + ']');
            }
            catch (err) {
                reject(new Error('failed to parse arguments for method "' + method + '" of resource "' + resource_name + '"'));
            }

            var statement = resource_name + ' ' + method + ' ' + '(' + strargs + ')';

            args.push(function (e, r) {
                if (e == null) {
                    resolve(r);
                }
                else {
                    reject(new Error(JSON.stringify(e)));
                }
            });

            resource[method].apply(this, args);
        }
    );

    p.then(function(val) {
        cb({result:val});
    }, function(error) {
        cb({error:error});
    });
}

function runScript(sdk, script, r, line, cb) {
    var s = null;
    if (script.length > 0) {
        s = script.pop();
    }
    if (s == null) {
        cb({val:r});
        return;
    }
    if (typeof(s) == 'string') {
        run(sdk, s, function(r) {
            if (r.error) {
               cb({error:'line number: '+line+': '+r.error.message});
                return;
            }
            runScript(sdk, script, r.result, ++line, cb);
            return;
        });
    }
    else if (typeof(s) == 'function') {
        var ret = s(r);

        runScript(sdk, script, ret, ++line, cb);
        return;
    }
    else {
        cb({error:'line number: '+line+': cannot parse'});
    }
}

function getResources(o) {
    var res = [];
    for (var name in o) {
        if (o.hasOwnProperty(name) && (typeof(o[name]) == "object")) {
            res.push(name);
            var r = getResources(o[name]);
            r.forEach(function(v) {
                res.push(name+'.'+v);
            });
        }
    }
    return res;
}



function login(ver) {
    if ($.isEmptyObject(sdk[ver].sdk)) {
        logMsg('ERROR', 'Initialization attempted for unknown version!');
        return;
    }
    if (!sdk[ver].sdk.APP.SDK.initialized) {
        $.post("/login", {'version':ver}, function (data, status) {
            if (data) {
                if (data.access_token) {
                        sdk[ver].sdk.APP.SDK.init($, {
                            domain: sdk[ver]['domain'],
                            port: 443,
                            https: true,
                            client_token: data.access_token,
                            version2: ver == 'v2' ? false : false
                        },
                        function () {
                            current_version = ver;
                            logMsg("INFO", "Version '"+ver+"' initialized!");
                        });
                }
                else {
                    logMsg("ERROR", "Initializaton of version '"+ver+"' failed: "+data.message);
                }
            }
        }, "json")
            .fail(function (jqXHR, status, error) {
                alert("Initialization of version '"+ver+"' failed! "+error);
            });
    }
    else {
        current_version = ver;
    }
}

function reloadSDK()
{
    $('script[src$="sdk.js"]').remove();
    $('head').append('<script src="js/sdk.js""></script>');
}

function execute(versions, data, isScript, cb, results) {
    var ver;
    results = results || [];
    if (results.length == 0) {//original entry
        logMsg("START", "Running version...");
    }
    var data_copy = data.slice();
    if (versions.length == 0) {
        logMsg("END", "done");
        if (cb && (typeof(cb) == 'function')) {
            cb(results);
        }
        return;
    }
    else {
        ver = versions.pop();
        logMsg("CONTINUE", ver+"...");
    }
    if (!isScript) {

        var resource = getSelectedResource($('.resources').val(), ver);
        var method = $('.methods').val();
        data.push(function(e,r) {
            results.push({e:e,r:r,v:ver});
            data = data_copy;
            execute(versions, data, isScript, cb, results);
        });
        try {
            resource[method].apply(resource, data);
        }
        catch (error) {
            results.push({e: error.message,r:null,v:ver});
            execute(versions, data, isScript, cb, results);
        }

    }
    else {
        runScript(sdk[ver].sdk.APP.SDK, data, null, 1, function (ret) {
            var e = !!ret.error ? ret.error : null;
            var r = !!ret.val ? ret.val : null;
            results.push({e:e,r:r,v:ver});
            data = data_copy;
            execute(versions, data, isScript, cb, results);
        });
    }

}


function runScriptArray(versions, scripts) {
    if (scripts.length == 0) {
        return;
    }
    var versions_copy = versions.slice();
    s = [scripts.pop()];
    execute(versions, s, true, function (results) {
        evaluateResults(results);
        versions = versions_copy;
        runScriptArray(versions, scripts);
    });
}

function evaluateResults(results) {
    if (results.length == 0) {
        //logMsg("INFO", "No values returned.");
    }
    else if (results.length == 1) {
        if (results[0].e == null) {
            logMsg("RESULT", JSON.stringify(results[0].r));
        }
        else {
            logMsg("ERROR", JSON.stringify(results[0].e));
        }
    }
    else {
        var passed = true;
        var message = '';
        for (var i=1; i<results.length; i++) {
            if (results[i].e != null) {
                if (results[0].e == null) {
                    passed = false;
                    message += "Version "+results[i].v+" returned error. Version "+results[0].v+" did not.";
                    break;
                }
            }
            else if (results[i].e == null) {
                if (results[0].e != null) {
                    passed = false;
                    message += "Version "+results[0].v+" returned error. Version "+results[i].v+" did not.";
                    break;
                }
            }
            if ((results[i].e == null) && (results[0].e == null)) {
                if (typeof(results[i].r) != typeof(results[0].r)) {
                    passed = false;
                    message += "Returned types from version "+results[i].v+" version "+results[0].v+" are different.";
                    break;
                }
                else {
                    if ((typeof(results[0].r) == "string") ||
                        (typeof(results[0].r) == "number") ||
                        (typeof(results[0].r) == "boolean")) {
                        if (results[0].r != results[i].r) {
                            passed = false;
                            message += "version "+results[i].v+" returned '"+results[i].r+"' ,"+
                                       "version "+results[0].v+" returned '"+results[0].r+"'";
                            break;
                        }
                    }
                    else if (Array.isArray(results[0].r) && Array.isArray(results[i].r)) {
                        passed = results[0].r.length == results[i].r.length;
                        if (!passed) {
                            message += "Returned array length from version "+results[0].v+" is "+results[0].r.length+" and from version "+results[i].v+" is "+results[i].r.length;
                            break;
                        }
                    }
                    else if (typeof(results[0].r) == "object") {
                        for (var key in results[0].r) {
                            if (results[0].r.hasOwnProperty(key)) {
                                if (typeof(results[i].r[key]) != typeof(results[0].r[key])) {
                                    passed = false;
                                    break;
                                }
                            }
                        }
                        if (!passed) {
                            message += "Returned array keys differ in type or number between versions "+results[0].v+" and "+results[i].v;
                            break;
                        }
                    }
                }
            }
        }
        logMsg("INFO", "Test "+(passed ? "passed" : "failed"))
        if (!passed) {
            logMsg("ERROR", message);
        }
    }
    if (in_recording_mode) {
        recorded_results.push(results);
    }
    else {
        playback_results.push(results);
    }
}

function do_record(resource, method, vals) {
    var newvals = [];
    var script = "'"+resource+"."+method+"(";
    vals.forEach(function(v) {
        if (typeof(v) == "string") {
            var m = v.match(/(.*)\/\/\$\{(.*)\}$/);
            if (m == null) {
                script += '"'+v+'",';
                newvals.push(v);
            }
            else {
                script += '"${'+m[2]+'}",';
                newvals.push(m[1]);
            }
        }
        else if (typeof(v) == "object") {
            script += JSON.stringify(v)+',';
            newvals.push(v);
        }
    });
    script = script.replace(/,$/,'');
    script += ")'";
    //logMsg("INFO","Recorded: >"+script);
    recorded_script.push(script);
    return newvals;
}

/*function popupRecordedResults() {
    var ele = $('div.recorded-results').clone();
    var tab = ele.find('table');
    var headers = [];
    var row = '';
    for (var ver in sdk) {
        if (sdk.hasOwnProperty(ver)) {
            row = row + '<th>'+ver+'</th>';
            headers.push(ver);
        }
    }
    tab.append('<tr>'+row+'</tr>');

    var k = 0;
    recorded_results.forEach(function(results) {
        var values = [];
        var len = values.length;
        row = '';
        for (var i=0; i<headers.length; i++) {
            for (var j=0; j<results.length; j++) {
                if (headers[i] == results[j].v) {
                    values.push(results[j].r);
                    break;
                }
            }
            if (values.length == len) {
                values.push(null);
                row = row + '<td>'+''+'</td>';
            }
            else {
                row = row + '<td>'+recorded_script[k]+'</td>';
            }
            len++;
        }
        k++;
        tab.append('<tr>'+row+'</tr>');
    });
    showPopup(ele, {width:700});
}*/
function popupRecordedResults(inp) {
    var ele = $('div.recorded-results').clone();
    var headers = [];
    for (var ver in sdk) {
        if (sdk.hasOwnProperty(ver)) {
            headers.push(ver);
        }
    }
    var expand = '<a class="adjust">&nbsp;&nbsp;+</a>';
    var collapse = '<a class="adjust">&nbsp;&nbsp;-</a>';

    var html = '';

    for  (var i=0; i<recorded_results.length; i++) {
        var cls = 'r-' + i;
        html += '<li>' + recorded_script[i] + '<ul class="' + cls + '">';
        for (var j = 0; j < recorded_results[i].length; j++) {
            var ncls = cls + '-' + j
            html += '<li>' + recorded_results[i][j].v + collapse + '<ul class="' + ncls + '">';
            ncls = ncls + '-r';
            html = getResultsAsTreeElements(recorded_results[i][j].r, ncls, html);
            html += '</ul></li>';
        }
        html += '</ul></li>';
    }
    ele.find('ul:first').append(html);
    ele.find('.adjust').click(function() {
        var ul = $(this).next();
        if (ul.length > 0) {
            if (ul.hasClass('hide')) {
                ul.removeClass('hide');
                $(this).html('&nbsp;&nbsp;-');
            }
            else {
                ul.addClass('hide');
                $(this).html('&nbsp;&nbsp;+');
            }
        }
    });
    ele.find('.sel').click(function() {
        var id = convertToIdentifier($(this).parent().attr("class"));
        var val = $(this).parent().text();
        var m = val.match(/^.*=\"(.*)\".*$/);
        if (m != null) {
            inp.val(m[1]+"//"+id);
        }
        else {
            input.val(" selection failed");
        }
        hidePopup();
    });
    showPopup(ele, {width:700, height:500});
}

function getResultsAsTreeElements(r, cls, html) {

    var expand = '<a class="adjust">&nbsp;&nbsp;+</a>';
    var collapse = '<a class="adjust">&nbsp;&nbsp;-</a>';
    var sel = '<a class="sel">select</a>';

    if ((typeof(r) == "boolean") ||
        (typeof(r) == "number") ||
        (typeof(r) == "string")) {
        html += '<li class="'+cls+'">'+r+sel+'</li>';
    }
    else if (Array.isArray(r)) {
        html += '<li>['+ r.length + ']'+collapse;
        html += '<ul class="'+cls+'">';
        for (var i=0; i< r.length; i++) {
            var ncls = cls + '-' + i;
            html += '<li>'+i+collapse;
            html += '<ul class="'+ncls+'">';
            html = getResultsAsTreeElements(r[i], ncls, html);
            html += '</ul></li>';
        };
        html += '</ul></li>';
    }
    else if (typeof(r) == "object") {
        for (var key in r) {
            if (r.hasOwnProperty(key)) {
                html += '<li class="'+cls+'-'+key+'">['+key+']='+JSON.stringify(r[key])+sel+'</li>';
            }
        }
    }
    return html;
}

function convertToIdentifier(str) {
    var ids = str.split('-');
    var identifier = '${r';
    if (ids != null) {
        for (var i=0; i<ids.length; i++) {
            if ((i==0) && (ids[i] == 'r')) {
                continue;
            }
            if (!isNaN(ids[i])) {
                identifier += '['+ids[i]+']';
            }
            else {
                identifier += '.'+ids[i];
            }
        };
    }
    identifier += '}';
    return identifier;
}

function fixArgumentReferences(str) {
    var re = /\$\{(.*?)\}/g;
    var r = playback_results;
    var orig = [];
    var conv = [];
    var m;
    do {
        m = re.exec(str);
        if (m) {
            try {
                conv.push(eval(m[1]));
            }
            catch(error) {
                throw new Error("Error evaluating: "+m[1]+"-"+error.message);
            }
            orig.push(m[1]);
        }
    } while (m);
    re = /\$\{(.*?)\}/;
    for (var i=0; i<orig.length; i++) {
        str = str.replace("${"+orig[i]+"}",conv[i]);
    }
    return str;
}
