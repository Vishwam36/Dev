var storage = new LocalStorage();
var blackList = [];
var restrictionList = [];
var notifyList = [];
var blockBtnList = ['settingsBtn', 'restrictionsBtn', 'notifyBtn', 'aboutBtn', 'feedbackBtn'];
var blockList = ['settingsBlock', 'restrictionsBlock', 'notifyBlock', 'aboutBlock', 'feedbackBlock'];

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('settingsBtn').addEventListener('click', function () {
        setBlockEvent('settingsBtn', 'settingsBlock');
    });
    document.getElementById('restrictionsBtn').addEventListener('click', function () {
        setBlockEvent('restrictionsBtn', 'restrictionsBlock');
    });
    document.getElementById('notifyBtn').addEventListener('click', function () {
        setBlockEvent('notifyBtn', 'notifyBlock');
    });
    document.getElementById('aboutBtn').addEventListener('click', function () {
        setBlockEvent('aboutBtn', 'aboutBlock');
        loadVersion();
    });
    document.getElementById('feedbackBtn').addEventListener('click', function () {
        setBlockEvent('feedbackBtn', 'feedbackBlock');
    });
    document.getElementById('clearAllData').addEventListener('click', function () {
        clearAllData();
    });
    document.getElementById('exportToCsv').addEventListener('click', function () {
        exportToCSV();
    });
    document.getElementById('backup').addEventListener('click', function () {
        backup();
    });
    document.getElementById('restore').addEventListener('click', function () {
        restoreDataClick();
    });
    document.getElementById('file-input-backup').addEventListener('change', function (e) {
        restore(e);
    });
    document.getElementById('viewTimeInBadge').addEventListener('change', function () {
        storage.saveValue(SETTINGS_VIEW_TIME_IN_BADGE, this.checked);
    });
    document.getElementById('darkMode').addEventListener('change', function () {
        storage.saveValue(SETTINGS_DARK_MODE, this.checked);
    });
    document.getElementById('intervalInactivity').addEventListener('change', function () {
        storage.saveValue(SETTINGS_INTERVAL_INACTIVITY, this.value);
    });
    $('.clockpicker').clockpicker();

    loadSettings();
});

function setBlockEvent(btnName, blockName) {
    blockBtnList.forEach(element => {
        if (element === btnName) {
            document.getElementById(btnName).classList.add('active');
        }
        else document.getElementById(element).classList.remove('active');
    });

    blockList.forEach(element => {
        if (element === blockName) {
            document.getElementById(blockName).hidden = false;
        } else document.getElementById(element).hidden = true;
    });
}

function loadSettings() {
    storage.getValue(SETTINGS_INTERVAL_INACTIVITY, function (item) {
        document.getElementById('intervalInactivity').value = item;
    });
    storage.getValue(SETTINGS_VIEW_TIME_IN_BADGE, function (item) {
        document.getElementById('viewTimeInBadge').checked = item;
    });
    storage.getValue(SETTINGS_DARK_MODE, function (item) {
        document.getElementById('darkMode').checked = item;
    });
    storage.getMemoryUse(STORAGE_TABS, function (integer) {
        document.getElementById('memoryUse').innerHTML = (integer / 1024).toFixed(2) + 'Kb';
    });
    storage.getValue(STORAGE_TABS, function (item) {
        let s = item;
    });
}

function loadVersion() {
    var version = chrome.runtime.getManifest().version;
    document.getElementById('version').innerText = 'v' + version;
}

function exportToCSV() {
    storage.getValue(STORAGE_TABS, function (item) {
        toCsv(item);
    });
}

function backup() {
    storage.getValue(STORAGE_TABS, function (item) {
        let tabs = JSON.stringify(item);
        createFile(tabs, "application/json", 'backup.json');
        viewNotify('notify-backup');
    });
}

function restoreDataClick() {
    document.getElementById('file-input-backup').click();
}

function restore(e) {
    let file = e.target.files[0];
    if (file.type === "application/json") {
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        reader.onload = readerEvent => {
            let content = readerEvent.target.result;
            let tabs = JSON.parse(content);
            chrome.extension.getBackgroundPage().tabs = tabs;
            storage.saveTabs(tabs, allDataDeletedSuccess);
            viewNotify('notify-restore');
        }
    } else {
        viewNotify('notify-restore-failed');
    }
}

function toCsv(tabsData) {
    var str = 'domain,date,time(sec)\r\n';
    for (var i = 0; i < tabsData.length; i++) {
        for (var y = 0; y < tabsData[i].days.length; y++) {
            var line = tabsData[i].url + ',' + tabsData[i].days[y].date + ',' + tabsData[i].days[y].summary;
            str += line + '\r\n';
        }
    }

    createFile(str, "text/csv", 'domains.csv');
}

function createFile(data, type, fileName) {
    var file = new Blob([data], { type: type });
    var downloadLink;
    downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.href = window.URL.createObjectURL(file);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function clearAllData() {
    var tabs = [];
    chrome.extension.getBackgroundPage().tabs = tabs;
    storage.saveTabs(tabs, allDataDeletedSuccess);
}

function allDataDeletedSuccess() {
    viewNotify('notify');
}

function viewNotify(elementName) {
    document.getElementById(elementName).hidden = false;
    setTimeout(function () { document.getElementById(elementName).hidden = true; }, 3000);
}

function addNewSiteClickHandler(lblName, timeName, actionCheck, notifyBlock) {
    var newSite = document.getElementById(lblName).value;
    var newTime;
    if (timeName != null)
        newTime = document.getElementById(timeName).value;
    if (newSite !== '' && (newTime === undefined || (newTime !== undefined && newTime !== ''))) {
        if (!actionCheck(newSite, newTime))
            viewNotify(notifyBlock);
    }
}

function addDomainToListBox(domain) {
    var li = document.createElement('li');
    li.innerText = domain;
    var del = document.createElement('img');
    del.height = 12;
    del.src = '/icons/delete.png';
    del.addEventListener('click', function (e) {
        deleteBlackSite(e);
    });
    document.getElementById('blackList').appendChild(li).appendChild(del);
}

function addDomainToEditableListBox(entity, elementId, actionEdit, actionDelete, actionUpdateTimeFromList, actionUpdateList) {
    var li = document.createElement('li');

    var domainLbl = document.createElement('input');
    domainLbl.type = 'text';
    domainLbl.classList.add('readonly-input', 'inline-block', 'element-item');
    domainLbl.value = entity.domain;
    domainLbl.readOnly = true;
    domainLbl.setAttribute('name', 'domain');

    var edit = document.createElement('img');
    edit.setAttribute('name', 'editCmd');
    edit.height = 14;
    edit.src = '/icons/edit.png';
    edit.addEventListener('click', function (e) {
        actionEdit(e, actionUpdateTimeFromList, actionUpdateList);
    });

    var del = document.createElement('img');
    del.height = 12;
    del.src = '/icons/delete.png';
    del.classList.add('margin-left-5');
    del.addEventListener('click', function (e) {
        actionDelete(e, actionUpdateTimeFromList, actionUpdateList);
    });

    var bloc = document.createElement('div');
    bloc.classList.add('clockpicker');
    bloc.setAttribute('data-placement', 'left');
    bloc.setAttribute('data-align', 'top');
    bloc.setAttribute('data-autoclose', 'true');
    var timeInput = document.createElement('input');
    timeInput.type = 'text';
    timeInput.classList.add('clock', 'clock-li-readonly');
    timeInput.setAttribute('readonly', true);
    timeInput.setAttribute('name', 'time');
    timeInput.value = convertShortSummaryTimeToString(entity.time);
    bloc.appendChild(timeInput);

    var hr = document.createElement('hr');
    var li = document.getElementById(elementId).appendChild(li);
    li.appendChild(domainLbl);
    li.appendChild(del);
    li.appendChild(edit);
    li.appendChild(bloc);
    li.appendChild(hr);
}

function actionEditSite(e, actionUpdateTimeFromList, actionUpdateList) {
    var targetElement = e.path[1];
    var domainElement = targetElement.querySelector('[name="domain"]');
    var timeElement = targetElement.querySelector('[name="time"]');
    if (timeElement.classList.contains('clock-li-readonly')) {
        timeElement.classList.remove('clock-li-readonly');
        var hour = timeElement.value.split(':')[0].slice(0, 2);
        var min = timeElement.value.split(':')[1].slice(1, 3);
        timeElement.value = hour + ':' + min;
        var editCmd = targetElement.querySelector('[name="editCmd"]');
        editCmd.src = '/icons/success.png';
        $('.clockpicker').clockpicker();
    }
    else {
        var domain = domainElement.value;
        var time = timeElement.value;
        if (domain !== '' && time !== '') {
            var editCmd = targetElement.querySelector('[name="editCmd"]');
            editCmd.src = '/icons/edit.png';
            timeElement.classList.add('clock-li-readonly');
            var resultTime = convertShortSummaryTimeToString(convertTimeToSummaryTime(time));
            timeElement.value = resultTime;

            actionUpdateTimeFromList(domain, time);
            actionUpdateList();
        }
    }
}