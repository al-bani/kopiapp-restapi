let value = new Map();

const setValue= () => {
    let sign = "a"
    value.set(sign, {
        "aku" : "islam"
    });
}

const getValue = () => {
    console.log(value.get("a"));
}

getValue();