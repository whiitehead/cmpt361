class Camera extends Entity {
    constructor(modelViewUniform, projectionUniform) {
        super(new Matrix())
        this.uniform = modelViewUniform
        this.controllable = false

        this.width = gl.canvas.clientWidth
        this.height = gl.canvas.clientHeight

        const fieldOfView = (45 * Math.PI) / 180 // in radians
        const aspect = this.width / this.height
        const near = 0.1
        const far = 100.0
        this.projectionMatrix = create.matrix.projection(fieldOfView, aspect, near, far)
        gl.uniformMatrix4fv(projectionUniform, false, this.projectionMatrix.out)
    }

    initControls(window, ...clickFunctions) {
        this.controllable = true

        this.clickFunctions = clickFunctions

        this.wheel = 0

        this.r = false

        this.click = {
            left: false,
            right: false
        }

        this.clickPosition = {
            x: 0,
            y: 0
        }

        this.mousePosition = {
            x: 0,
            y: 0
        }

        this.lastMousePosition = {
            x: 0,
            y: 0
        }

        window.addEventListener("contextmenu", event => event.preventDefault())

        document.querySelector("canvas").addEventListener("mousedown", event => {
            if (event.button === 0) this.click.left = true
        })

        window.addEventListener("mousedown", event => {
            if (event.button === 2) this.click.right = true
        })

        window.addEventListener("mouseup", event => {
            if (event.button === 2) this.click.right = false
        })

        window.addEventListener("mousemove", event => {
            this.mousePosition.x = (event.clientX * 2) / this.width - 1
            this.mousePosition.y = ((event.clientY * 2) / this.height - 1) * -1
        })

        window.addEventListener("wheel", event => {
            this.wheel = event.deltaY
        })

        window.addEventListener("keydown", event => {
            if (event.key === "r") {
                this.r = true
            }
        })
    }

    control() {
        if (!this.controllable) {
            throw new Error("Camera controls have not been initialized")
        }

        if (this.r) {
            this.r = false
            this.reset()
            return
        }

        if (this.wheel) {
            this.matrix = create.matrix.translation(0, 0, this.wheel).dot(this.matrix)
            this.wheel = 0
        }

        const movement = {
            x: this.mousePosition.x - this.lastMousePosition.x,
            y: this.mousePosition.y - this.lastMousePosition.y
        }

        this.lastMousePosition = {
            x: this.mousePosition.x,
            y: this.mousePosition.y
        }

        if (this.click.right && (movement.x != 0 || movement.y != 0)) {
            const position = this.matrix.position
            // nod-yes
            this.matrix = create.matrix.rotation.axis(-movement.x / 500, 0, 1, 0).dot(this.matrix)
            // shake-no
            this.matrix = create.matrix.rotation.axis(-movement.y / 500, 1, 0, 0).dot(this.matrix)
            this.matrix.m[3] = [...position, 1]
        }

        if (this.click.left) {
            this.clickPosition.x = this.mousePosition.x
            this.clickPosition.y = this.mousePosition.y
            this.click.left = false
            this.clickFunctions.forEach(clickFunction =>
                clickFunction(this.mousePosition.x, this.mousePosition.y)
            )
        }
    }

    lookAtCenter(position) {
        const up = [0, 1, 0]
        var zAxis = vector.normalize(vector.negate(position))
        var xAxis = vector.normalize(vector.cross(up, zAxis))
        var yAxis = vector.normalize(vector.cross(zAxis, xAxis))

        // prettier-ignore
        this.matrix = new Matrix([
            [...xAxis, 0],
            [...yAxis, 0],
            [...zAxis, 0],
            [...position, 1]
        ])
    }

    reset(theta = 0.4, x = 0, y = -25, z = -35) {
        this.matrix = new Matrix()
        this.matrix = create.matrix.translation(x, y, z)
        this.matrix = create.matrix.rotation.x(theta).dot(this.matrix)
    }

    view(gl) {
        gl.uniformMatrix4fv(this.uniform, false, this.matrix.out)
    }

    clear(gl) {
        gl.clearColor(0.6, 0.6, 0.9, 1.0) // Clear to black, fully opaque
        gl.clearDepth(1.0) // Clear everything
        gl.enable(gl.DEPTH_TEST) // Enable depth testing
        gl.depthFunc(gl.LEQUAL) // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
}

// var v = normalize(subtract(at, eye)) // view direction vector
// var n = normalize(cross(v, up)) // perpendicular vector
// var u = normalize(cross(n, v)) // "new" up vector

// v = negate(v)

// var result = mat4(vec4(n, -dot(n, eye)), vec4(u, -dot(u, eye)), vec4(v, -dot(v, eye)), vec4())

// return result
