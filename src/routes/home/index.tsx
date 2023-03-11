import { h, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import createEdgeModule from '../../edge-classic';

let windowWidth = 1280;
let windowHeight = 720;

// https://www.raymondcamden.com/2018/10/05/storing-retrieving-photos-in-indexeddb

if (typeof window !== "undefined") {

    //windowWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    //windowHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);

    windowWidth = document.documentElement.clientWidth;
    windowHeight = document.documentElement.clientHeight;

    window.addEventListener('load', function () {
        window.focus();
        document.body.addEventListener('click', function (e) {
            window.focus();
        }, false);
    });
}

enum EdgeState {
    Choose,
    Loading,
    Playing
};

const Choose: FunctionComponent<{ callback: (wad: string) => void }> = ({ callback }) => {

    let database: IDBDatabase | undefined;

    const dbrequest = window.indexedDB.open('/edge-classic');

    dbrequest.onerror = function (e) {
        console.error('Unable to open database.');
    }

    dbrequest.onupgradeneeded = (e) => {
        // Save the IDBDatabase interface
        const db = (e.target as IDBOpenDBRequest).result as IDBDatabase;

        if (!db.objectStoreNames.contains("FILE_DATA")) {
            console.log("Creating FILE_DATA object store");
            const store = db.createObjectStore("FILE_DATA", {});
            store.createIndex("timestamp", "timestamp", { unique: false });

        }
    };

    dbrequest.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result as IDBDatabase;
        database = db;
    }

    return <div>
        <div style="padding:24px;text-align:center">
            <button style="font-size:24px;padding:8px" onClick={() => {
                callback("freedoom2.wad");
            }}>Play Freedoom</button>
        </div>
        <div style="padding:24px;text-align:center">
            <button style="font-size:24px;padding:8px" onClick={() => document.getElementById('getWadFile').click()}>Choose Wad</button>
        </div>
        <input id="getWadFile" style="display:none" type="file" onChange={(e) => {

            if (!database) {
                console.error("No database on wad upload");
                return;
            }

            //const file = e.target.files[0];
            const files = (e.target as any).files as File[];
            if (files.length !== 1) {
                e.preventDefault();
                alert("Please select a single wad file");
                return;
            }

            const file = files[0];
            if (!file.name.toLowerCase().endsWith(".wad")) {
                e.preventDefault();
                alert("Please select a single wad file");
                return;
            }

            var reader = new FileReader();
            reader.readAsArrayBuffer(file);

            reader.onload = function (e) {
                //alert(e.target.result);
                let bits = e.target.result;

                const contents = new Uint8Array(bits as ArrayBuffer);

                const trans = database.transaction(['FILE_DATA'], 'readwrite');
                const path = `/edge-classic/${file.name}`;
                let addReq = trans.objectStore('FILE_DATA').put({ timestamp: new Date(), mode: 33206, contents: contents }, path);

                addReq.onerror = function (e) {
                    console.log('error storing data');
                    console.error(e);
                }

                trans.oncomplete = function (e) {
                    console.log('data stored');
                    callback(file.name);
                }
            }

        }} />
    </div>
}

const Loading = () => {
    return <div style={`font-size:24px;color:white;text-align:center;padding-top:48px;`}>Loading - Please Wait - TODO: fancy progress indicator</div>
}

const Playing: FunctionComponent<{ wad: string }> = ({ wad }) => {

    const [state, setState] = useState<{ loading: boolean, wad?: string }>({ loading: true });

    useEffect(() => {

        const canvas = document.querySelector('#canvas');
        if (!canvas) {
            throw "Unable to get canvas";
        }

        console.log(`EDGE: canvas created at ${windowWidth} x ${windowHeight}`)

        canvas.addEventListener("webglcontextlost", function (e) { alert('FIXME: WebGL context lost, please reload the page'); e.preventDefault(); }, false);

        const args = ["-home", "edge-classic", "-windowed", "-width", windowWidth.toString(), "-height", windowHeight.toString(), "-iwad", "freedoom2.wad"];

        if (wad !== "freedoom2.wad") {
            args.push("-file")
            args.push(`edge-classic/${wad}`);
        }

        createEdgeModule({
            edgePostInit: () => {
                console.log("Post-Init!");
                setState({ ...state, loading: false });
            },
            preEdgeSyncFS: () => {
            },
            postEdgeSyncFS: () => {
            },
            arguments: args,
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
        {state.loading && <Loading />}
        <canvas style={state.loading ? "display:none;" : "display:block;"} id="canvas" width={`${windowWidth}px`} height={`${windowHeight}px`} onContextMenu={(event) => event.preventDefault()}></canvas>
    </div>
}

const Edge = () => {

    const [wad, setWad] = useState("");

    return <div>
        {!wad && <Choose callback={(wad) => { setWad(wad) }} />}
        {!!wad && <Playing wad={wad} />}
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
