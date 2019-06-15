# A*搜索算法-解8数码问题

> 2018.5.4

## 目录
[TOC]
## 问题分析
* 在3×3的棋盘，摆有1至8八个数码。棋盘上还有一个空格（0数码），与空格相邻的数码可以移到空格中。

* 要求解决的问题是：给出一个初始状态和一个目标状态，找出一种从初始转变成目标状态的移动步数最少的移动步骤。


* 棋盘上数码排列情况，一共有『9的阶乘』种不同状态。每个状态和一个数码序列（从左到右从上到下降维）一一映射，那么这些状态可以按『数码序列的逆序数的奇偶性』分为两类。

* 由于合法移动空数码（0数码），状态逆序数的奇偶性不变。当初始状态和目标状态，逆序数的奇偶性不同时，无解。

* 也说明，如果采用穷举搜索，最坏要搜索 9!/2 =181440 个状态，才能找到目标或确认无解。

## 成果实现
一个网页文件，算法逻辑和图形演示用JavaScript实现，用主流浏览器打开即可：
https://ljkojbk.github.io/EightDigitPuzzle/

## 概念
### 图
* 对事物每个不同的状态，用一个结点表示
* 一个状态通过某个操作转换成另一个状态，以『操作』为边，每条边有自己的『代价』
* 结点和边构成图，成为状态空间。它是可确定但未实际生成的

### 树
* 由一个初始状态展开搜索，要找到目的状态
* 只能通过已探知（检查）结点的边，来探知（生成）新结点
* 这样，所有目前已生成的结点，可连接为一棵树
* 不同的搜索过程对应于：一棵搜索树的生长过程
* 不同的搜索算法对应于：从未检查的结点里，选取结点来检查的方式（若检查后不是目标结点则从它展开生成新结点）
* 一个优秀的搜索算法，应该『明智』地选取展开的结点，来使最终检查的结点数尽可能少

### 最优解
* 花费代价最少的一个操作序列，使初始状态转变成目标状态

### 结点的F值
* 表示从初始结点，经该结点，到达目标花费的代价
* F = G（到该结点已经花费的代价）+ D（到达目标的实际剩余代价）
* 一般D是无法得知的，用H（到达目标的估计剩余代价）来模拟，本程序用曼哈顿距离来模拟H
* 所以说，A*是启发式搜索。H的获取方式不同，效果也不同
    * H < D：搜索的点数多，效率低。但得到的一定是最优解
    * H = D：搜索将严格沿着最优路径进行，此时搜索效率最高
    * H > D：搜索的点数少，效率高，但得到的不一定是最优解
				
## 算法流程
1. 生成一个初始结点，代表初始数码状态
2. 检查结点
    1. 若是目标结点，则返回搜索树上到初始结点的路径，算法结束
    2. 若不是目标结点，则从该结点按合法操作，生成『新结点』
        1. 若『新结点』在已检查过的结点列表里，则忽略，不插入搜索树
        2. 若『新结点』在已生成未检查的结点列表里，则更新F值，插入搜索树
3. 从未检查的结点里，找出F值最小的，转入2

## 数据结构

### State
```javascript
function State(preState, blankIndex) {
    if (preState) {
        // array 表示当前数码状态
        this.array = Array.from(preState.array);
        this.array[preState.blankIndex] = this.array[blankIndex];
        this.array[blankIndex] = Puzzle.blank;

        // 空数码的位置
        this.blankIndex = blankIndex;

        // 已经花费的代价
        this.g = preState.g + 1;

        // 估计 离目标的剩余代价
        this.h = this.getHeuristic();

        this.f = this.g + this.h;
        this.preState = preState;
    }
}
// 判断当前结点是否是目标结点
State.prototype.isSolved = function () {...
};
// 判断当前结点是否在stateList中
State.prototype.indexxOf = function (stateList) {...
};
// 得到h
State.prototype.getHeuristic = function () {...
};

```
* 注意，变量 array 是一个脱离字面量的一维数组：
    * 把3X3的棋盘从左到右从上到下编号为0-8
    * array[i]表示，当前在i位置的方块最终要到array[i]编号的位置
    * 另外还要设一个变量blankIndex，记录空数码方块的下标
			
### Move

```javascript
var Move = {
    up: function (state) {
        if (state.blankIndex > 2)
            return new State(state, state.blankIndex - 3);
    },
    down: function (state) {...
    },
    left: function (state) {...
    },
    right: function (state) {...
    },
};
```	
### Puzzle

```javascript
var Puzzle = {

    createInitialState: function (init, dest) {...
    },
    
    set: function () {
        Puzzle.init = Input.initStr.split('').map(function (data) {
            return parseInt(data);
        });
        Puzzle.dest = Input.destStr.split('').map(function (data) {
            return parseInt(data);
        });
        Puzzle.initialState = Puzzle.createInitialState(Puzzle.init, Puzzle.dest);
    },
    
    isSolvable: function () {...
    },
    
    solveByAStar: function () {...
    }
};
```	


### Puzzle.solveByAStar()
```javascript
    solveByAStar: function () {
        if (!Puzzle.isSolvable()) {
            return undefined;
        }
        // 依次存放生成的结点
        var generatedList = [];
        // 存放已生成但未检查的结点
        var openList = [];
        // 存放已检查的结点
        var closedList = [];

        openList.push(Puzzle.initialState);
        generatedList.push(Puzzle.initialState);
        
        while (openList.length) {
            openList.sort(function (a, b) {
                return a.f - b.f;
            });
            // 用nowState获取openList中f值最小的结点
            var nowState = openList.shift();

            closedList.push(nowState);

            // 当nowState为目标时，成功返回解路径
            if (nowState.isSolved()) {...
            }
            
            tryInsertOpenList(Move.up(nowState));
            tryInsertOpenList(Move.down(nowState));
            tryInsertOpenList(Move.left(nowState));
            tryInsertOpenList(Move.right(nowState));
        }
        return false;
    }

```

			
## 图形化接口
一个实例如下：

```
// 设置初始及目标
Input.initStr = 243716058
Input.destStr = 123456780

// 调用Puzzle.solveByAStar()后返回 一个对象
console.log(Puzzle.solveByAStar());

--------------- 输出如下 ---------------
{ 
  data: // 依次存放生成的结点：结点的id，array（数码序列），f
   [ { id: 0, array: [Array], f: 8 },
     { id: 1, array: [Array], f: 8 },
     { id: 2, array: [Array], f: 10 },
     { id: 3, array: [Array], f: 10 },
     { id: 4, array: [Array], f: 8 },
     { id: 5, array: [Array], f: 8 },
     { id: 6, array: [Array], f: 8 },
     { id: 7, array: [Array], f: 10 },
     { id: 8, array: [Array], f: 8 },
     { id: 9, array: [Array], f: 10 },
     { id: 10, array: [Array], f: 10 },
     { id: 11, array: [Array], f: 8 },
     { id: 12, array: [Array], f: 8 },
     { id: 13, array: [Array], f: 10 },
     { id: 14, array: [Array], f: 10 },
     { id: 15, array: [Array], f: 8 },
     { id: 16, array: [Array], f: 10 },
     { id: 17, array: [Array], f: 8 },
     { id: 18, array: [Array], f: 10 },
     { id: 19, array: [Array], f: 10 },
     { id: 20, array: [Array], f: 8 } ],
  process: // 存放每次 检查的结点的id，和从该结点展开生成的新结点的id
   [ { parent: 0, children: [Array] },
     { parent: 1, children: [Array] },
     { parent: 4, children: [Array] },
     { parent: 5, children: [Array] },
     { parent: 6, children: [Array] },
     { parent: 8, children: [Array] },
     { parent: 11, children: [Array] },
     { parent: 12, children: [Array] },
     { parent: 15, children: [Array] },
     { parent: 17, children: [Array] },
     { parent: 20 } ],
  moves:  // 表示找到的解路径：每次和空数码交换的数码 的位置
   [ 3, 4, 1, 0, 3, 4, 7, 8 ] 
}
```




## 图形化技术
数码方块移动：原生JS + 朴素的html标签 + css 
搜索树的演示：采用基于SVG（可缩放矢量图形）的[D3.js](https://d3js.org)框架



