const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const raiz=path.resolve(__dirname,'..');
const archivos=[];
const visitar=d=>{for(const entrada of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d,entrada.name);
    if(entrada.isDirectory()) visitar(p);
    else if(entrada.isFile()&&p.endsWith('.js')) archivos.push(p);
}};
for(const carpeta of ['src','scripts']) visitar(path.join(raiz,carpeta));
let errores=0;
for(const archivo of archivos){const r=spawnSync(process.execPath,['--check',archivo],{encoding:'utf8'});
    if(r.status!==0){errores++;console.error(archivo, r.stderr);}}
console.log(`Revisión de sintaxis: ${archivos.length} archivos, errores: ${errores}`);
if(errores)process.exitCode=1;
