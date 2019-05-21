let treeSVG = {
    h: 700,
    duration: 300,

    initSVG() {
        treeSVG.w = document.getElementById("instruction").offsetWidth - 3;

        // document.getElementById("instruction").style.width=treeSVG.w;
        treeSVG.diagonal = d3.svg.diagonal();
        treeSVG.tree = d3.layout.tree().size([treeSVG.w - 20, treeSVG.h - 20]);
        treeSVG.tool_tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-8, 0])
            .html(function (d) {

                let arr = Array.from(d.data.array);
                arr.splice(0, 0, '');
                arr.splice(4, 0, '<br>');
                arr.splice(8, 0, '<br>');

                return arr.join('&nbsp;');
            });

        treeSVG.svg = undefined;
        treeSVG.vis = undefined;
        treeSVG.initNode = undefined;
        treeSVG.data = [];
        treeSVG.process = [];
        treeSVG.root = {};
        treeSVG.toggleUpdate = undefined;
    },

    resetSVG() {
        if (treeSVG.svg) {
            treeSVG.svg.remove();

            $('#treeFrame').css("visibility", "hidden");

            // 当Result没有更新，却reset时
            if(Result !== undefined && Result.data[0].children !== undefined) {
                return false;
            }
        }


        if(Result !== undefined) {
            treeSVG.toggleUpdate = true;
            treeSVG.process = Result.process;
            treeSVG.data = Result.data;
            treeSVG.root = treeSVG.data[0];

            treeSVG.svg = d3.select("#treeFrame").append("svg:svg")
                .attr("width", treeSVG.w)
                .attr("height", treeSVG.h)
                .attr("id", "svgg")
                .on("click", treeSVG.update);

            treeSVG.vis = treeSVG.svg.append("svg:g")
                .attr("transform", "translate(10, 10)");

            treeSVG.vis.call(treeSVG.tool_tip);

            treeSVG.initNode = treeSVG.vis.selectAll(".node")
                .data(treeSVG.tree(treeSVG.root))
                .enter().append("g")
                .attr("class", "node")
                .attr("id", treeSVG.nodeIdstr)
                .attr("transform", treeSVG.nowPosition);

            treeSVG.initNode.append("circle")
                .attr("r", 5)
                .on('mouseover', treeSVG.tool_tip.show)
                .on('mouseout', treeSVG.tool_tip.hide);

            treeSVG.initNode.append("text")
                .text(treeSVG.nodeF)
                .attr("dy", 3)
                .attr("x", 8);
        }
        return true;
    },

    update() {
        if (treeSVG.toggleUpdate) {
            let expand = treeSVG.process.shift();
            if (!treeSVG.process.length) {
                if(expand){
                    treeSVG.vis.select("#node" + expand.parent)
                        .attr("class", "node desired choose");
                }
                return false;
            }

            treeSVG.vis.select("#node" + expand.parent)
                .attr("class", "node not");

            let parent = treeSVG.data[expand.parent];
            parent.children = [];

            while (expand.children.length) {
                parent.children.push(treeSVG.data[expand.children.pop()]);
            }

            let nodes = treeSVG.tree(treeSVG.root);
            // Update the nodes…
            let node = treeSVG.vis.selectAll(".node")
                .data(nodes, treeSVG.nodeId);

            let newNode = node.enter().append("g")
                .attr("class", "node")
                .attr("id", treeSVG.nodeIdstr)
                .attr("transform", function (d) {
                    return "translate(" + d.parent.data.x0 + "," + d.parent.data.y0 + ")";
                });

            newNode.append("circle")
                .attr("r", 5)
                .on('mouseover', treeSVG.tool_tip.show)
                .on('mouseout', treeSVG.tool_tip.hide);

            newNode.append("text")
                .text(treeSVG.nodeF)
                .attr("dy", 3)
                .attr("x", 8);

            node.exit().remove();

            // 此时 node 里有newNode ！
            node.transition()
                .duration(treeSVG.duration)
                .attr("transform", treeSVG.nowPosition);

            // Update the links…
            let link = treeSVG.vis.selectAll("path.link")
                .data(treeSVG.tree.links(nodes), treeSVG.linkId);

            // Enter any new links at the parent's previous position.
            link.enter().insert("svg:path", "node")
                .attr("class", "link")
                .attr("d", function (d) {
                    let o = {x: d.source.data.x0, y: d.source.data.y0};
                    return treeSVG.diagonal({source: o, target: o});
                })
                .transition()
                .duration(treeSVG.duration)
                .attr("d", treeSVG.diagonal);

            // Transition links to their new position.
            link.transition()
                .duration(treeSVG.duration)
                .attr("d", treeSVG.diagonal);

            treeSVG.toggleUpdate = false;

        } else {
            treeSVG.vis.select("#node" + treeSVG.process[0].parent)
                .attr("class", "node choose");

            treeSVG.toggleUpdate = true;
        }
        return true;
    },

    linkId(d) {
        return d.source.data.id + "-" + d.target.data.id;
    },

    nodeId(d) {
        return d.data.id;
    },

    nodeIdstr(d) {
        return "node" + d.data.id;
    },

    nodeF(d) {
        return d.data.f;
    },

    nowPosition(d) {
        d.data.x0 = d.x;
        d.data.y0 = d.y;
        return "translate(" + d.x + "," + d.y + ")";
    }
};

treeSVG.initSVG();
