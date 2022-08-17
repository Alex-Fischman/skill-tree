window.addEventListener("load", update);
window.addEventListener("resize", update);
function update() {
	let query = new URLSearchParams(location.search);
	let text = query.get("text");
	document.getElementById("text").value = text;

	let nodes = [...text.matchAll(/([~-]) (.+): (.*)\n/g)]
		.map(match => ({ name: match[2], desc: match[3], is_story: match[1] === "~" }));
	let edges = [...text.matchAll(/\n(.+?) -> (.+?)(?=\n|$)/g)].map(match => ({
		start: nodes.find(n => n.name === match[1]),
		end: nodes.find(n => n.name === match[2])
	}));

	for (let node of nodes) node.children = edges.filter(e => e.start === node).map(e => e.end);
	for (let node of nodes) {
		node.parents = edges.filter(e => e.end === node).map(e => e.start);
		if (node.parents.length > 1) console.error("more than one parent of node", node);
	}

	{
		let ns = nodes.filter(n => n.children.length === 0);
		while (ns.length !== 0) ns = ns.flatMap(n => {
			n.width = n.children.map(c => c.width).reduce((a, b) => a + b, 0) || 1;
			n.height = 1 + Math.max(0, ...n.children.map(c => c.height));
			return n.parents;
		});
	} {
		let ns = nodes.filter(n => n.parents.length === 0);
		while (ns.length !== 0) ns = ns.flatMap(n => {
			n.left = n.parents[0]?.left || 0;
			if (n.parents[0]) n.parents[0].left += n.width;
			n.x = n.left || 0 + n.width / 2 - 0.5;
			n.y = (n.parents[0]?.y + 1) || 0;
			return n.children;
		});
	} {
		let cells = document.getElementById("nodes");
		cells.replaceChildren();
		let {left, top, width, height} = cells.getBoundingClientRect();
		let cellWidth = width / Math.max(...nodes.map(n => n.width));
		let cellHeight = height / Math.max(...nodes.map(n => n.height));
		for (let i = 0; i <= Math.max(...nodes.map(n => n.y)); ++i) {
			for (let node of nodes.filter(n => i === n.y)) {
				let cell = cells.appendChild(document.createElement("div"));
				cell.style.position = "absolute";
				cell.style.left = left + node.x * cellWidth + "px";
				cell.style.top = top + node.y * cellHeight + "px";
				cell.style.width = cellWidth + "px";
				cell.style.height = cellHeight + "px";
				cell.addEventListener("click", () => {
					query.set("desced", node.name);
					location.search = query.toString();
				}, {capture: true});
				let text = cell.appendChild(document.createElement("div"));
				text.innerText = node.name;
				text.id = "node: " + node.name;
				if (node.is_story) text.style.borderRadius = cellHeight + "px";
			}
		}
	} {
		let lines = document.getElementById("edges");
		lines.replaceChildren();
		for (let node of nodes) {
			let a = document.getElementById("node: " + node.name).getBoundingClientRect();
			for (let child of node.children) {
				let b = document.getElementById("node: " + child.name).getBoundingClientRect();
				let line = lines.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "line"));
				line.setAttribute("x1", a.left + a.width / 2);
				line.setAttribute("y1", a.bottom);
				line.setAttribute("x2", b.left + b.width / 2);
				line.setAttribute("y2", b.top);
				line.setAttribute("stroke", "black");
			}
		}
	}

	if (query.get("desced")) {
		let node = nodes.find(n => n.name === query.get("desced"));
		let name = document.createElement("h1");
		name.innerText = node.name;
		let desc = document.createElement("div");
		desc.innerHTML = node.desc;
		document.getElementById("desc").replaceChildren(name, desc);
	}
}

window.addEventListener("keydown", e => {
	if (e.ctrlKey && e.key === "s") {
		e.preventDefault();
		let query = new URLSearchParams(location.search);
		query.set("text", document.getElementById("text").value);
		location.search = query.toString();
	} else if (e.key === "Escape") {
		e.preventDefault();
		let query = new URLSearchParams(location.search);
		query.set("desced", "");
		location.search = query.toString();
	}
});
