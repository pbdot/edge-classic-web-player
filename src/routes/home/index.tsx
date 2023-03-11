import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import createEdgeModule from '../../edge-classic';

let windowWidth = 1280;
let windowHeight = 720;

if (typeof window !== "undefined") {

    windowWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    windowHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);

    window.addEventListener('load', function () {
        window.focus();
        document.body.addEventListener('click', function (e) {
            window.focus();
        }, false);
    });
}

const Edge = () => {

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const canvas = document.querySelector('#canvas');
        if (!canvas) {
            throw "Unable to get canvas";
        }

        console.log(`EDGE: canvas created at ${windowWidth} x ${windowHeight}`)

        canvas.addEventListener("webglcontextlost", function (e) { alert('FIXME: WebGL context lost, please reload the page'); e.preventDefault(); }, false);

        createEdgeModule({
            edgePostInit: () => {
                console.log("Post-Init!");
                setLoading(false);
            },
            preEdgeSyncFS: () => {
            },
            postEdgeSyncFS: () => {
            },
            arguments: ["-windowed", "-width", windowWidth.toString(), "-height", windowHeight.toString(), "-iwad", "freedoom2.wad", "-home", "/edge-classic"],
            preInit: () => {
                console.log("Pre-Init");                
            },
            preRun: [],
            postRun: [],
            print: (function () {
                return function (text) {
                    text = Array.prototype.slice.call(arguments).join(' ');
                    console.log(text);
                };
            })(),
            printErr: function (text) {
                text = Array.prototype.slice.call(arguments).join(' ');
                console.error(text);
            },
            canvas: canvas,
            setStatus: function (text) { console.log("status", text) },
            monitorRunDependencies: function (left) { console.log("left " + left) },
        }).then(module => {
            module.canvas = canvas;
        });


        return () => {

        };

    }, [])

    return <div>
        { loading && <div style={`font-size:24px;color:white;text-align:center;padding-top:48px;`}>Loading - Please Wait - TODO: fancy progress indicator</div> }
        <canvas style={loading ? "display:none;" : "display:block;"} id="canvas" width={`${windowWidth}px`} height={`${windowHeight}px`} onContextMenu={(event) => event.preventDefault()}></canvas>
    </div>
};


const Home = () => {
    return (
        <div style="width:100vw;">
            <Edge />
        </div>
    );
};

export default Home;
