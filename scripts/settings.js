var storage = new LocalStorage();
var blackList = [];
var restrictionList = [];
var notifyList = [];
var blockBtnList = ['settingsBtn', 'restrictionsBtn', 'notifyBtn', 'aboutBtn'];
var blockList = ['settingsBlock', 'restrictionsBlock', 'notifyBlock', 'aboutBlock'];

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
    });

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

