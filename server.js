const express = require('express')
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const multer = require('multer')
const fs = require('fs')
const { Router } = express
const app = express()
const httpServer = HttpServer(app)
const io = new IOServer(httpServer)




app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(express.static(__dirname + "/Public"))



// configuracion pug 

app.set('views', './views')
app.set('view engine', 'pug')

// Router 

const routerProductos = new Router
app.use('/api/productos', routerProductos)

// Clase contenedor

class Container{
    constructor (nombre){
        this.nombre = nombre
    }

    writeFile = async data =>{
        try {
            await fs.promises.writeFile(
                this.nombre, JSON.stringify(data, null, 2)
            )
        } catch (err){
            console.log('Hay un error en la escritura del archivo ' + err)
        }
    }

    getAll = async() => {
        try {
            const productos = await fs.promises.readFile(this.nombre, 'utf-8')
            return JSON.parse(productos)
        } catch(err){
            console.log('error al obtener todos los datos ' + err)
        }
    }

    save = async obj => {
        let productos = await this.getAll()
        try{
            let newId;
            if(productos.length === 0){
                newId = 1
            } else {
                newId = productos[productos.length-1].id + 1
            }
            let newObj = {...obj, id: newId}
            productos.push(newObj)
            await this.writeFile(productos)
            return newObj.id
        } catch (err){
            console.log('Error en el guardado de archivo ' + err)
        }
    }

    save2 = async obj =>{
        try {
            const datos = await fs.promises.readFile(this.nombre, 'utf-8');
            const archivoParse = JSON.parse(datos);
            archivoParse.push({...obj});
            fs.promises.writeFile(this.nombre, JSON.stringify(archivoParse, null , 2))
        } catch (error) {
            console.log('Error al escribir el archivo' + error)
        }      
    }

    getById = async id => {
        let productos = await this.getAll()
        try {
            const obj = productos.find(obj => obj.id === id)
            return obj ? obj : null
        } catch (err){
            console.log('Error obteniendo el objeto por id' + err)
        }
    }

    deleteById = async id => {
        let productos = await this.getAll()
        try{
            productos = productos.filter(producto => producto.id != id)
            await this.writeFile(productos)
            return {res: "Objeto eliminado"}
        } catch(err){
            console.log('error eliminando objeto por id ' + err)
        }
    }

    deleteAll = async() =>{
        await fs.this.writeFile(this.ruta, JSON.stringify([], null, 2))
    }

    update = async (id, obj) => {
        try {
            const prods = await fs.promises.readFile(this.nombre, 'utf-8');
            const fileParse = JSON.parse(prods);
            let productoEncontrado = fileParse.find(e => e.id === id)
            if (productoEncontrado) {
                let newArray = fileParse.filter(e => e.id !== id)
                productoEncontrado = {...obj, id: id}
                newArray.push(productoEncontrado)
                fs.promises.writeFile(this.nombre, JSON.stringify(newArray, null , 2))
                return `Se actualizo exitosamente el producto ${JSON.stringify(productoEncontrado)}`
            }else{
                return "No se encontro el producto"
            }
        } catch (error) {
            return "El archivo no existe, no hay productos"
        }
    }
}

const prueba = new Container ('./productos.txt')

const mensajes = new Container ('./mensajes.txt')




// get 

routerProductos.get("/", async (req, res) => {
    const productos = await prueba.getAll()
    res.render("layout", {productos})
})


routerProductos.get("/:id", async (req, res) => {
    const id = req.params.id
    if(null){
        res.json({error:'No hay producto con esa id'})
    }
    res.json(await prueba.getById(parseInt(id)))
})

//post


routerProductos.post("/", async (req, res) => { 
    res.json(await prueba.save(req.body), res.redirect('/api/productos'))
})

// put

routerProductos.put("/:id", async (req, res) => {
    const id = req.params.id 
    const obj = req.body
    res.json(await prueba.update(parseInt(id), obj))
})


// delete 

routerProductos.delete("/:id", async (req, res) => {
    const id = req.params.id
    res.json(await prueba.deleteById(parseInt(id)))
})

//sockets

io.on('connection', async socket=>{

    socket.emit('messages', await mensajes.getAll())

    socket.on('new-message', async data=>{
        await mensajes.save2({...data, fyh: new Date().toLocaleString()})

        io.sockets.emit('messages', await mensajes.getAll())
    })
})

//server

const PORT = 8080

httpServer.listen(PORT, ()=>{
    console.log('Servidor escuchando en ' + PORT)
})

console.log(mensajes.getAll())