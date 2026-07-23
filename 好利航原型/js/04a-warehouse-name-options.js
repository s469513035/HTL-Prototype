function getWarehouseNameOptions(){
    const c=TC['cfg-warehouse']||{};
    const idx=(c.h||[]).indexOf('仓库名称');
    const names=[];
    (c.d||[]).forEach(function(row){
        const name=row[idx>=0?idx:1];
        if(name&&!names.includes(name))names.push(name);
    });
    return names;
}
