// 棋盘上一个数码快的构造函数
function PuzzlePiece(digit, height, width) {
    this.digit = digit;
    this.indexx = digit;

    let d = $('<div>', {
        css: {
            border: '1px solid black',
            height: height - 2,
            width: width - 2,
            position: 'absolute',
            backgroundColor: 'white',
            fontSize: '' + 8 + 'em',
            lineHeight: '200px',
            textAlign: 'center',
        },
        html: digit
    });
    // 空数码块不显示
    if (digit === 0) {
        d.css('visibility', 'hidden');
    }

    // 绑定 数据和视图
    this.container = d;
    d.data("piece", this);
}

// 重新绘制棋盘上某个数码的位置到x, y
PuzzlePiece.prototype.freshPosition = function (x, y, do_animation) {
    this.xPos = x;
    this.yPos = y;

    if (do_animation) { // 是否以延迟动画的方式演示棋盘位置的改变
        this.container.animate({
            top: y,
            left: x
        }, delayTimes);
    } else {
        this.container.css({
            top: y,
            left: x
        });
    }
};


let GAME = (function ($) {  // 传入jQuery对象，自动调用，返回一个对象，赋值给GAME
    let gameBoardContainer; // 棋盘的container
    let solver;
    let solution;
    let pieceWidth;         // 棋盘每个块的宽度，未改应该是200px
    let pieceHeight;        // 棋盘每个块的高度，未改应该是200px
    let pieces = [];        // 棋盘
    let blankPiece;         // 空块

    // 进行初始化,为container初始化棋盘，添加点击事件
    function init() {
        gameBoardContainer.css("visibility", "hidden");
        create_pieces();
        setupEventListener(gameBoardContainer, 'click');
    }

    // 创建初始化的棋盘，默认棋盘排布为0-8正序
    function create_pieces() {
        pieceWidth = gameBoardContainer.width() / 3;
        pieceHeight = gameBoardContainer.height() / 3;

        for (let i = 0; i < 9; i++) {
            pieces.push(new PuzzlePiece(i, pieceHeight, pieceWidth));
        }

        blankPiece = pieces[0];
        return pieces;
    }

    // 按照字符串str设置棋盘的分布
    function set_pieces(str) {
        let arr = Array(9); // 每个数字目前所在的位置，从0开始
        str.split('').forEach((digit, index) => {
            arr[digit] = index;
        });

        let copy = Array(9);
        // pirces[i].index处的数字为棋盘所在位置的数字，赋给pieces[i].digit
        for (let i = 0; i < 9; i++) {
            pieces[i].indexx = arr[pieces[i].digit];
            copy[pieces[i].indexx] = pieces[i];
        }

        pieces = copy;
        draw_pieces();
    }

    // 根据棋盘状态重新绘制棋盘
    function draw_pieces() {
        if (!gameBoardContainer) {
            throw "Need a container to draw board";
        }

        let counter = 0;
        for (let i = 0; i < 3; i++) {
            let y = pieceHeight * i;
            for (let j = 0; j < 3; j++) {
                let x = pieceWidth * j;

                let p = pieces[counter++];
                p.freshPosition(x, y); // 将棋盘上某个数码p的position设为x, y
                $(gameBoardContainer).append(p.container);
            }
        }
    }

    // 棋盘上每个数码div的点击事件，点击后尝试对该div进行移动
    function handleClick() {
        // 获取视图绑定的数据
        let piece = $(this).data("piece");
        try_move(piece);
    }

    // 为棋盘的container添加点击事件到下面div上，并绑定点击事件为handleClick
    function setupEventListener(element, event) {
        if (element) {
            element.on(event, "div", handleClick);
        }
    }

    // 移除棋盘的container下面的div上处理函数为的handleClick的事件
    function removeEventListener(element, event) {
        if (element) {
            element.off(event, "div", handleClick);
        }
    }

    // 点击了某个数码div尝试移动的函数，如果空位在该div的上下左右处，则进行移动
    function try_move(piece) {
        switch (piece.indexx) {
            case blankPiece.indexx + 1:
            case blankPiece.indexx - 1:
            case blankPiece.indexx + 3:
            case blankPiece.indexx - 3:
                move(piece);
                break;
            default:
                console.log("I can't move");
        }
    }

    // 在可以移动时，移动某个数码
    function move(piece) {
        // 交换在piece数组里的位置
        let temp = piece.indexx;
        pieces[temp] = blankPiece;
        pieces[blankPiece.indexx] = piece;
        piece.indexx = blankPiece.indexx;
        blankPiece.indexx = temp;

        // 交换html里的位置
        let pieceX = piece.xPos;
        let pieceY = piece.yPos;

        piece.freshPosition(blankPiece.xPos, blankPiece.yPos, true);
        blankPiece.freshPosition(pieceX, pieceY);

        // 改变位置字符串的值
        let str = '';
        for (let i = 0; i < 9; i++) {
            str += pieces[i].digit;
        }
        Input.initStr = str;

        $('#iinitStr').css("border-color", "#ccc").css("color", "black").blur(function () {
            $(this).css("border-color", "#ccc").css("color", "black");
        }).attr('value', str);
    }

    return { // 返回一个对象，有一个createNewGame方法，传入container和initStr返回一个对象
        createNewGame(container, initStr) {
            gameBoardContainer = container;
            init();                 // 初始化棋盘container
            set_pieces(initStr);    // 按字符串设置棋盘的分布
            gameBoardContainer.css("visibility", "visible");

            return {
                set_pieces,
                move_position(index) { // 改变棋盘某个数码的位置，即在这个数码div上发生了点击事件
                    $(pieces[index].container).trigger('click');
                },
                destroy() {
                    removeEventListener(gameBoardContainer, 'click');
                    gameBoardContainer.empty();
                    gameBoardContainer = null;
                    solver = null;
                    solution = null;
                    pieceWidth = null;
                    pieceHeight = null;
                    pieces = [];
                    blankPiece = null;
                }
            };
        }
    }
})(jQuery);
