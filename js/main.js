// var btnScramble  = $('#btnScramble');

let delayTimes = 200; // 每个数字快移动的延时

let Input = { // 输入的当前状态串与目标状态串
    initStr: '013485276', //21
    destStr: '123456780'

    // initStr: '254873160', //98
    // destStr: '123456780'

    // initStr: '513276408', //176
    // destStr: '243716058'

    // initStr: '358710246',//867
    // destStr: '123456780'

    // initStr: '735148206',//3014
    // destStr: '123456780'

    // initStr: '304571826', // 无解
    // destStr: '123456780'
};

let Game = GAME.createNewGame($('#game_board'), Input.initStr); // Game是游戏对象
let Result = undefined;

// 检查字符串的合理性，是否为0-8的不重复数字构成，有9位
function checkStr(str) {
    let check = 0;
    let arr = str.split('');

    if (arr.length !== 9) {
        return false;
    }
    arr.forEach(function (data) {
        check += parseInt(data);
    });

    return check === 36; // 0 + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8
}

// 初始化当前状态字符串，检测当前状态字符串的输入是否合法，每次输入框失去焦点时检测
$('#iinitStr').attr('value', Input.initStr).blur(function () {
    $(this).css("border-color", "#ccc").css("color", "black");
}).focus(function () {
    $(this).css("border-color", "black").css("color", "#ccc");
}).change(function () {
    let istr = $(this).val();

    if (checkStr(istr)) { // 字符串合法
        $(this).blur(function () {$(this).css("border-color", "#ccc").css("color", "black");});
        Input.initStr = istr;
        Game.set_pieces(istr); // 根据字符串重新绘制棋盘
    } else { // 不合法字符串标红
        $(this).blur(function () {$(this).css("border-color", "red").css("color", "red");});
    }
});

// 初始化目标状态字符串，检测目标状态字符串的输入是否合法，每次输入框失去焦点时检测
$('#idestStr').attr('value', Input.destStr).blur(function () {
    $(this).css("border-color", "#ccc").css("color", "black");
}).focus(function () {
    $(this).css("border-color", "black").css("color", "#ccc");
}).change(function () {
    let dstr = $(this).val();

    if (checkStr(dstr)) { // 字符串合法
        $(this).blur(function () {$(this).css("border-color", "#ccc").css("color", "black");});
        Input.destStr = dstr;
    } else { // 不合法字符串标红
        $(this).blur(function () {$(this).css("border-color", "red").css("color", "red");});
    }
});

// 点击一步完成演示
$('#finishh').on('click', function (e) {
    e.preventDefault();
    // 如果生成生成的节点大于30则生成树节点的速度加快
    treeSVG.duration = Result.data.length > 30 ? ~~(9000 / Result.data.length) : 300;

    let interval = setInterval(() => {
        if (!treeSVG.update()) {
            treeSVG.duration = 300;
            clearInterval(interval);
        }
    }, treeSVG.duration);
});

// 显示底下演示面板和生成树，并将屏幕拖到面板顶部位置
function showTree(){
    treeSVG.resetSVG();
    $('#treeFrame').css("visibility", "visible");
    $(window).scrollTop($('#treeFrame').offset().top);
}

// 点击自动求解，产生解
$('#solve').on('click', function (e) {
    e.preventDefault();

    $('#iinitStr').css("border-color", "#ccc").css("color", "black").attr('value', Input.initStr).blur(() => {
        $(this).css("border-color", "#ccc").css("color", "black");
    });

    $("#idestStr").css("border-color", "#ccc").css("color", "black").attr('value', Input.destStr).blur(() => {
        $(this).css("border-color", "#ccc").css("color", "black");
    });

    // 点击不同的求解方法，使用不同的解法获得结果
    switch (e.target.id) {
        case 'DFSSolve': {
            Result = Puzzle.solveByDFS();
            break;
        }
        case 'BFSSolve': {
            Result = Puzzle.solveByBFS();
            break;
        }
        case 'AStarSolve': {
            Result = Puzzle.solveByAStar();
            break;
        }
    }

    // 隐藏生成树
    if (treeSVG.svg) {
        treeSVG.svg.remove();
        $('#treeFrame').css("visibility", "hidden");
    }

    if (Result !== undefined) {
        // 显示生成的节点数，路径的步数，显示查看搜索过程的点击标签
        $('#resultt').css("color", "green").html(Result.prompt + "<br><br><a href=\"#instruction\" onclick=\"showTree();\">查看搜索过程</a>");

        let intervall = setInterval(() => {
            // 改变棋盘某个数码的位置，即在这个数码的div上发生点击事件，参数为index
            Game.move_position(Result.moves.shift());

            if (!Result.moves.length) { // 结束所有的移动
                clearInterval(intervall);
            }
        }, delayTimes);

    } else { // 无解情况
        treeSVG.resetSVG();
        $('#resultt').css("color", "red").html("无解。<a  href=\"more.png\" target=\"_blank\">为什么？</a>");
    }
});