// 数字块四个移动的方向
const Move = {
    // state.blankIndex 0-8分别代表空白块的位置
    up(state) {
        if (state.blankIndex > 2) {
            return new State(state, state.blankIndex - 3);
        }
    },
    down(state) {
        if (state.blankIndex < 6) {
            return new State(state, state.blankIndex + 3);
        }
    },
    left(state) {
        if (state.blankIndex % 3 > 0) {
            return new State(state, state.blankIndex - 1);
        }
    },
    right(state) {
        if (state.blankIndex % 3 < 2) {
            return new State(state, state.blankIndex + 1);
        }
    },
};

// 棋盘状态的构造函数，根据上个状态产生一个新状态并返回
function State(preState, blankIndex) {
    if (preState) {
        // array 表示当前数码状态
        this.array = Array.from(preState.array);
        // 将当前有内容的数字块移动到原来空白块的位置
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

// 检查问题是否解决
State.prototype.isSolved = function () {
    for (let i = 0; i < this.array.length; i++) {
        if (this.array[i] !== i) {
            return false;
        }
    }
    return true;
};

// 判断当前节点是否再stateList中（已经生成过）
State.prototype.indexxOf = function (stateList) {
    let L = stateList.length;
    let N = this.array.length;

    for (let i = 0; i < L; i++) {
        let j = 0;
        for (; j < N; j++) {
            if (this.array[j] !== stateList[i].array[j]) {
                break;
            }
        }
        if (j === N) {
            return i;
        }
    }
    return -1;
};

State.prototype.indexxxOf = function (stateList) {
    let mark = -1;//判断是否有 op 0:没有
    let p = stateList;
    //p clsoetable
    for(let i = 0; i < 9; i++) {
        let j = this.array[i] - '0';
        //console.log(p[i]);
        if(p[j] === -1) {
            mark = i;
            let now = [];
            for(let k = 0; k < 10; k++)
                now[k] = -1;
            p[j] = now;
        }
        p = p[j];
    }
    if(mark == -1)
        return 1;//在
    return -1;//不在
};

// 得到f = g + h 中的 h，使用曼哈顿距离
State.prototype.getHeuristic = function () {
    let manhattan = 0;
    // 曼哈顿距离 abs(x1 - x2) + abs(y1 - y2)
    for (let i = 0; i < this.array.length; i++) {
        if (i !== this.blankIndex) {
            // i / 3 是所在行数，i % 3 是列数
            manhattan += Math.abs(~~(i / 3) - ~~(this.array[i] / 3)) + Math.abs((i % 3) - (this.array[i] % 3));
        }
    }
    return manhattan;
};


let Puzzle = {
    // 初始化第一个状态
    createInitialState(init, dest) {
        let o = new State();
        o.blankIndex = init.indexOf(0);
        o.array = [];

        // o.array表示各个数应该在的位置，比如013485276的o.array是[8, 0, 2, 3, 7, 4, 1, 6, 5]
        for (let i = 0; i < init.length; i++) {
            o.array[i] = dest.indexOf(init[i]);
        }

        // 代表空数码的那个数字
        Puzzle.blank = o.array[o.blankIndex];

        o.g = 0;
        o.h = o.getHeuristic();
        o.f = o.g + o.h;
        return o;
    },

    // 设置Puzzle的init和dest数组，初始化首状态
    set() {
        Puzzle.init = Input.initStr.split('').map((data) => {
            return parseInt(data);
        });
        Puzzle.dest = Input.destStr.split('').map((data) => {
            return parseInt(data);
        });
        Puzzle.initialState = Puzzle.createInitialState(Puzzle.init, Puzzle.dest);
    },

    // 检查该8数码问题是否为可解的，当前状态与目标状态的数码序列的逆序奇偶性是否相同
    isSolvable() {
        Puzzle.set();
        let a = 0, b = 0, n = Puzzle.init.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                if (Puzzle.init[i] > Puzzle.init[j]) a++;
                if (Puzzle.dest[i] > Puzzle.dest[j]) b++;
            }
            if (Puzzle.init[i] === 0 && i % 2 === 1) a++;
            if (Puzzle.dest[i] === 0 && i % 2 === 1) b++;
        }
        return (a % 2 === b % 2);
    },

    // AStar核心代码
    solveByAStar() {
        if (!Puzzle.isSolvable()) {
            return undefined;
        }

        console.log('start searching');

        let closedList = [];        // CLOSED表
        let openList = [];          // OPEN表
        let generatedList = [];     // 记录已经生成的所有状态的表
        let showExpansion = [];     // 记录每个节点扩展状态的表，parent是从哪个节点扩展而来，children是扩展出的节点
        let oneExpand = {};         // 临时记录当前节点扩展出的状态
        let lastExpandedIndex = -1; // 记录上一个扩展节点的id，即扩展出当前节点的父节点的id
        let newInserted = [];       // 临时记录当前节点扩展出的子节点
        let start = new Date();

        // OPEN表保存所有已生成而未检查的节点，CLOSED表中记录已检查过的节点。
        openList.push(Puzzle.initialState);
        generatedList.push(Puzzle.initialState);
        Puzzle.initialState.id = 0;

        // 根据上一个状态产生了一个新状态，检测是否将该状态添加进OPEN表中
        function tryInsertOpenList(state) {
            if (state !== undefined && state.indexxOf(closedList) === -1) {
                openList.push(state);
                // id表示在已生成表中的位置
                state.id = generatedList.length;

                generatedList.push(state);
                newInserted.push(state);
            }
        }

        // 遍历当前OPEN表中的状态，直到找到解
        while (openList.length) {
            // 将OPEN表中的状态根据f值从小到大排序
            openList.sort(function (a, b) {
                return a.f - b.f;
            });

            // 取出OPEN表中的第一个状态
            // 从这个状态生成一棵树，parent是上一个扩展节点的id，children是扩展出来所有节点的id
            let nowState = openList.shift();
            oneExpand.parent = lastExpandedIndex;
            oneExpand.children = newInserted.map(value => value.id);

            showExpansion.push(oneExpand);

            oneExpand = {};
            newInserted = [];
            lastExpandedIndex = nowState.id;

            closedList.push(nowState);

            console.log('already checked ' + closedList.length + ' states');
            // 生成的节点，和检查的节点，和展开的节点
            if (nowState.isSolved()) {
                let end = new Date();
                let prompts = `生成了 <b>${generatedList.length}</b> 个节点状态，检查了 <b>${closedList.length}
                </b>个节点后，<br><br>找到了目标节点！返回了一条<b>${nowState.g}</b> 步的最短路径<br>运行时间${end - start}ms`;

                // 生成dataList，用于SVG渲染出生成树
                let dataList = generatedList.map((value, key) => {
                    return {
                        id: key,
                        array: value.array.map(v => Puzzle.dest[v]),
                        f: value.f
                    };
                });

                showExpansion.splice(0, 1);
                showExpansion.push({parent: lastExpandedIndex});

                // 生成要依次移动的位置
                let moveList = [];
                for(let p = nowState; p.id !== 0; p = p.preState){
                    moveList.push(p.blankIndex);
                }
                moveList.reverse();

                return {
                    data: dataList,
                    process: showExpansion,
                    moves: moveList,
                    prompt: prompts
                };
            }

            tryInsertOpenList(Move.up(nowState));
            tryInsertOpenList(Move.down(nowState));
            tryInsertOpenList(Move.left(nowState));
            tryInsertOpenList(Move.right(nowState));
        }
        return 0;
    },

    // BFS核心代码 广度优先搜索
    solveByBFS() {
        if (!Puzzle.isSolvable()) {
            return undefined;
        }

        console.log('start searching');

        let closedList1 = [];        // CLOSED表
        let closedList = [];        // CLOSED表
        let openList = [];          // OPEN表
        let generatedList = [];     // 记录已经生成的所有状态的表
        let showExpansion = [];     // 记录每个节点扩展状态的表，parent是从哪个节点扩展而来，children是扩展出的节点
        let oneExpand = {};         // 临时记录当前节点扩展出的状态
        let lastExpandedIndex = -1; // 记录上一个扩展节点的id，即扩展出当前节点的父节点的id
        let newInserted = [];       // 临时记录当前节点扩展出的子节点
        let start = new Date();

        // OPEN表保存所有已生成而未检查的节点，CLOSED表中记录已检查过的节点。
        openList.push(Puzzle.initialState);
        generatedList.push(Puzzle.initialState);
        Puzzle.initialState.id = 0;
        for(let k = 0; k < 9; k++)
            closedList[k] = -1;
        // 根据上一个状态产生了一个新状态，检测是否将该状态添加进OPEN表中
        function tryInsertOpenList(state) {
            if (state !== undefined && state.indexxxOf(closedList) === -1) {
                openList.push(state);
                // id表示在已生成表中的位置
                state.id = generatedList.length;

                generatedList.push(state);
                newInserted.push(state);
            }
        }

        // 遍历当前OPEN表中的状态，直到找到解
        while (openList.length) {
            // 取出OPEN表中的第一个状态
            // 从这个状态生成一棵树，parent是上一个扩展节点的id，children是扩展出来所有节点的id
            let nowState = openList.shift();
            oneExpand.parent = lastExpandedIndex;
            oneExpand.children = newInserted.map(value => value.id);

            showExpansion.push(oneExpand);

            oneExpand = {};
            newInserted = [];
            lastExpandedIndex = nowState.id;

            closedList1.push(nowState);

            console.log('already checked ' + closedList1.length + ' states');
            // 生成的节点，和检查的节点，和展开的节点
            if (nowState.isSolved()) {
                let end = new Date();
                let prompts = `生成了 <b>${generatedList.length}</b> 个节点状态，检查了 <b>${closedList1.length}
                </b>个节点后，<br><br>找到了目标节点！返回了一条<b>${nowState.g}</b> 步的最短路径<br>运行时间${end - start}ms`;

                // 生成dataList，用于SVG渲染出生成树
                let dataList = generatedList.map((value, key) => {
                    return {
                        id: key,
                        array: value.array.map(v => Puzzle.dest[v]),
                        f: value.f
                    };
                });

                showExpansion.splice(0, 1);
                showExpansion.push({parent: lastExpandedIndex});

                // 生成要依次移动的位置
                let moveList = [];
                for(let p = nowState; p.id !== 0; p = p.preState){
                    moveList.push(p.blankIndex);
                }
                moveList.reverse();

                return {
                    data: dataList,
                    process: showExpansion,
                    moves: moveList,
                    prompt: prompts
                };
            }

            tryInsertOpenList(Move.up(nowState));
            tryInsertOpenList(Move.down(nowState));
            tryInsertOpenList(Move.left(nowState));
            tryInsertOpenList(Move.right(nowState));
        }
        return 0;
    },

    // DFS核心代码 深度优先搜索
    solveByDFS(depth) {
        if (!Puzzle.isSolvable()) {
            return undefined;
        }

        console.log('start searching');

        const maxDepth = depth;        // 搜索的最大深度
        let closedList = [];        // CLOSED表
        let openList = [];          // OPEN表
        let generatedList = [];     // 记录已经生成的所有状态的表
        let showExpansion = [];     // 记录每个节点扩展状态的表，parent是从哪个节点扩展而来，children是扩展出的节点
        let oneExpand = {};         // 临时记录当前节点扩展出的状态
        let lastExpandedIndex = -1; // 记录上一个扩展节点的id，即扩展出当前节点的父节点的id
        let newInserted = [];       // 临时记录当前节点扩展出的子节点
        let start = new Date();

        // OPEN表保存所有已生成而未检查的节点，CLOSED表中记录已检查过的节点。
        openList.push(Puzzle.initialState);
        generatedList.push(Puzzle.initialState);
        Puzzle.initialState.id = 0;

        // 根据上一个状态产生了一个新状态，检测是否将该状态添加进OPEN表中，添加为头添加
        function tryInsertOpenList(state) {
            if (state !== undefined && state.indexxOf(closedList) === -1) {
                openList.unshift(state);
                // id表示在已生成表中的位置
                state.id = generatedList.length;

                generatedList.push(state);
                newInserted.push(state);
            }
        }

        // 遍历当前OPEN表中的状态，直到找到解
        while (openList.length) {
            // 超过最大深度则换一个最短的节点重新搜索
            if(openList[0].f > maxDepth) {
                openList.sort(function (a, b) {
                    return a.f - b.f;
                });
                if(openList[0].f > maxDepth) {
                    alert('当前深度下没有找到解！');
                    return ;
                }
            }

            // 取出OPEN表中的第一个状态
            // 从这个状态生成一棵树，parent是上一个扩展节点的id，children是扩展出来所有节点的id
            let nowState = openList.shift();
            oneExpand.parent = lastExpandedIndex;
            oneExpand.children = newInserted.map(value => value.id);

            showExpansion.push(oneExpand);

            oneExpand = {};
            newInserted = [];
            lastExpandedIndex = nowState.id;

            closedList.push(nowState);

            console.log('already checked ' + closedList.length + ' states');
            // 生成的节点，和检查的节点，和展开的节点
            if (nowState.isSolved()) {
                let end = new Date();
                let prompts = `生成了 <b>${generatedList.length}</b> 个节点状态，检查了 <b>${closedList.length}
                </b>个节点后，<br><br>找到了目标节点！返回了一条<b>${nowState.g}</b> 步的最短路径 <br>运行时间${end - start}ms`;

                // 生成dataList，用于SVG渲染出生成树
                let dataList = generatedList.map((value, key) => {
                    return {
                        id: key,
                        array: value.array.map(v => Puzzle.dest[v]),
                        f: value.f
                    };
                });

                showExpansion.splice(0, 1);
                showExpansion.push({parent: lastExpandedIndex});

                // 生成要依次移动的位置
                let moveList = [];
                for(let p = nowState; p.id !== 0; p = p.preState){
                    moveList.push(p.blankIndex);
                }
                moveList.reverse();

                return {
                    data: dataList,
                    process: showExpansion,
                    moves: moveList,
                    prompt: prompts
                };
            }

            tryInsertOpenList(Move.up(nowState));
            tryInsertOpenList(Move.down(nowState));
            tryInsertOpenList(Move.left(nowState));
            tryInsertOpenList(Move.right(nowState));
        }
        return 0;
    },
};
