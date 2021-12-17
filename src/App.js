import { useState, useRef, useEffect } from 'react';
import { matchSorter } from 'match-sorter'
// import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker';
// import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
// import vtkCoordinate from '@kitware/vtk.js/Rendering/Core/Coordinate';
// import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
// import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import 'animate.css';
import GWAS from './data/GWAS.json';
const GWASByIDP = GWAS.reduce((acc, curr) => {
  if (!(curr.IDP in acc)) {
    acc[curr.IDP] = [];
  }
  acc[curr.IDP].push(curr.ID);
  return acc;
}, {});
const GWASByAtlas = GWAS.reduce((acc, curr) => {
  const atlas = curr.IDP.substring(1, curr.IDP.indexOf('_'));
  if (!(atlas in acc)) {
    acc[atlas] = [];
  }
  acc[atlas].push(curr);
  return acc;
}, {});

function App() {
  // const vtkContainerRef = useRef(null);
  const backButtonRef = useRef(null);
  const vtkContainerRefs = {
    32: useRef(null),
    64: useRef(null),
    128: useRef(null),
    256: useRef(null),
    512: useRef(null),
    1024: useRef(null),
  };
  const [allActors, setAllActors] = useState({
    32: {},
    64: {},
    128: {},
    256: {},
    512: {},
    1024: {},
  });
  const [searchResults, setSearchResults] = useState([]);
  const [atlas, setAtlas] = useState(0);
  const [phenotype, setPhenotype] = useState('');
  const [grayedOut, setGrayedOut] = useState([]);
  const [renderWindows, setRendererWindows] = useState([]);
  // const [rotationIntervals, setRotationIntervals] = useState([]);

  const renderAtlas = (vtkContainerRef, k) => {
    // vtkContainerRef.current.innerHTML = '';
    if (vtkContainerRef.current.innerHTML !== '') {
      return;
    }

    // ----------------------------------------------------------------------------
    // Standard rendering code setup
    // ----------------------------------------------------------------------------

    // const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    //   rootContainer: vtkContainerRef.current,
    // });
    const genericRenderer = vtkGenericRenderWindow.newInstance();
    genericRenderer.setContainer(vtkContainerRef.current);

    const renderer = genericRenderer.getRenderer();
    const renderWindow = genericRenderer.getRenderWindow();
    renderer.setBackground(1, 1, 1);

    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;

    setRendererWindows((renderWindows) => [...renderWindows, renderWindow]);

    // ----------------------------------------------------------------------------
    // Example code
    // ----------------------------------------------------------------------------

    const reader = vtkPolyDataReader.newInstance();
    for (let i = 1; i <= k; i++) {

      reader.setUrl(`/data/MINA/C${k}/C${k}_C${i}.vtk`).then(() => {
        const polydata = reader.getOutputData();
        if (polydata === undefined) { // sometimes the browser will fail to load (as we're requesting files very quickly)
          return;
        }
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();

        actor.setMapper(mapper);
        mapper.setInputData(polydata);

        // const texture = vtkTexture.newInstance();
        // texture.setInterpolate(true);
        // texture.setRepeat(true);
        // texture.setInputData(polydata);
        // actor.addTexture(texture);
        // actor.getProperty().setOpacity(0.2);
        // actor.getProperty().setEdgeVisibility(true);
        // actor.getProperty().setLineWidth(2);
        actor.getProperty().setColor(Math.floor(Math.random() * 255) / 255, Math.floor(Math.random() * 255) / 255, Math.floor(Math.random() * 255) / 255);
        // actor.getProperty().setEdgeColor(255 / 255, 87 / 255, 36 / 255);
        // actor.getProperty().setRepresentationToPoints();

        renderer.addActor(actor);
        // somewhat arbitrarily chosen property to use as the id
        // any value that's unique (and referenceable outside of this function) will do
        const id = mapper.getInputData().getNumberOfCells();
        let tmp = allActors;
        tmp[k][id] = { name: `C${k}_${i}`, ids: GWASByIDP[`C${k}_${i}`], actor: actor };
        setAllActors(tmp);

        resetCamera();
        renderer.getActiveCamera().zoom(1.5);
        let orientation = actor.getOrientation()
        actor.setOrientation(orientation[0] + 20, orientation[1] + 25, 0);
        render();
      });

      // rotate each actor around camera
      // const roll = () => {
      //   // iterate through all actors
      //   const actors = renderer.getActors();
      //   actors.forEach((actor) => {
      //     actor.setOrientation(0, actor.getOrientation()[1] + 0.01, 0);
      //   });
      //   render();
      //   requestAnimationFrame(roll);
      // }
      // setRotationIntervals(rotationIntervals => [...rotationIntervals, requestAnimationFrame(roll)]);

    }

    // https://kitware.github.io/vtk-js/examples/CellPicker.html
    renderWindow.getInteractor().onRightButtonPress((e) => {
      if (renderer !== e.pokedRenderer) {
        return;
      }

      const pos = e.position;
      const picker = vtkCellPicker.newInstance();
      picker.setTolerance(0);
      picker.pick([pos.x, pos.y, 0], renderer);
      const cameraPos = renderer.getActiveCamera().getPosition();
      const largestDim = cameraPos.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0) * 2
      const sortedByDim = picker.getActors().sort((a, b) => (a.getBounds()[largestDim + 1] + a.getBounds()[largestDim]) - (b.getBounds()[largestDim + 1] + b.getBounds()[largestDim])).reverse()
      // console.log(cameraPos, ...picker.getActors().map(a => a.getBounds()), sortedByDim[0].getMapper().getInputData().getNumberOfCells());
      // const index = (renderer.getActiveCamera().getPosition()[2] > 0) ?  sortedByDim.length - 1 : 0;
      // picker.getActors().forEach((a) => console.log(a.getBounds(), a.getMapper().getInputData().getNumberOfCells(), picker.getPickPosition(), pos.x, pos.y));
      setPhenotype(allActors[k][sortedByDim[0].getMapper().getInputData().getNumberOfCells()].name);
      updateMenu(allActors[k][sortedByDim[0].getMapper().getInputData().getNumberOfCells()].name);


      // get list of actors, set opacity to 0.5
      const actors = renderer.getActors();
      const opacity = [];
      for (let i = 0; i < actors.length; i++) {
        const actor = actors[i];
        actor.getProperty().setColor(0.5, 0.5, 0.5);
        actor.getProperty().setOpacity(0.2);
        opacity.push(actor);
      }
      setGrayedOut(opacity);

      sortedByDim[0].getProperty().setColor(255 / 255, 0 / 255, 0 / 255);
      sortedByDim[0].getProperty().setOpacity(1);
      setAtlas(k)
      render(); // necessary to actually change color
      // if (vtkContainerRefs[k].current.parentNode.className === 'col-span-12') {
      //   vtkContainerRefs[k].current.parentNode.className = 'col-span-7'
      // }
      if (vtkContainerRefs[k].current.parentNode.className === 'col-span-12 sm:col-span-2') {
        animateIn(vtkContainerRefs, k, vtkContainerRefs[k].current.parentNode.children[1])
        updateMenu(`C${k}`)
      }
    });
  };

  useEffect(() => {
    for (const k in vtkContainerRefs) {
      if (Object.hasOwnProperty.call(vtkContainerRefs, k)) {
        const vtkContainerRef = vtkContainerRefs[k];
        if (vtkContainerRef.current.innerHTML !== '') {
          return; // does this ever happen?
        }
        if (k <= 128) {
          renderAtlas(vtkContainerRef, k);
        } else {
          vtkContainerRef.current.innerHTML = `
          <svg class="animate-spin h-20 w-20 my-20 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="margin:0 auto">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>`;
          vtkContainerRef.current.style = "min-height: 200px;padding-top: 50px;";
          setTimeout(() => {
            requestAnimationFrame(() => {
              vtkContainerRef.current.innerHTML = '';
              vtkContainerRef.current.style = "";
              renderAtlas(vtkContainerRef, k);
            });
          }, k * 5);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // }, [vtkContainerRefs, atlas]);

  const updateMenu = (x) => {
    if (!x) {
      return setSearchResults([]);
    }
    setSearchResults(matchSorter(atlas > 0 ? GWASByAtlas[atlas] : GWAS, x, { keys: atlas ? ['ID'] : ['ID', 'IDP'] }));
  }

  const animateIn = (refs, k, e, fullwidth = false) => {
    setAtlas(k);
    backButtonRef.current.classList.remove('hidden');
    backButtonRef.current.parentNode.children[1].classList.add('pl-24')
    e.classList.add('hidden'); // clicked button
    for (const key in refs) {
      if (Object.hasOwnProperty.call(refs, key)) {
        const r = refs[key];
        const el = r.current.parentNode;
        if (key !== k) {
          el.classList.add('animate__animated', 'animate__zoomOutRight');
          el.addEventListener('animationend', () => {
            el.classList.add('hidden');
            el.classList.remove('animate__animated', 'animate__zoomOutRight');
          }, { once: true });
        } else {
          el.classList.add('animate__animated', 'animate__zoomInLeft', (fullwidth) ? 'col-span-12' : 'col-span-7');
          el.classList.remove('col-span-12', 'sm:col-span-2');
          el.addEventListener('animationend', () => {
            el.classList.remove('animate__animated', 'animate__zoomInLeft');
          }, { once: true });
        }
      }
    }
  }

  const animateOut = (refs) => {
    setAtlas(0);
    backButtonRef.current.classList.add('hidden');
    for (const key in refs) {
      if (Object.hasOwnProperty.call(refs, key)) {
        const r = refs[key];
        const el = r.current.parentNode;
        if (el.classList.contains('hidden')) {
          el.classList.remove('hidden');
          el.classList.add('animate__animated', 'animate__zoomInLeft');
          el.addEventListener('animationend', () => {
            el.classList.remove('animate__animated', 'animate__zoomInLeft');
          }, { once: true });
        } else {
          el.classList.remove('col-span-7', 'col-span-12');
          el.classList.add('col-span-12', 'sm:col-span-2');
          el.children[1].classList.remove('hidden');
        }
      }
    }
  }

  return (
    <div>
      <div id="manhattan-modal" className="modal">
        <div className="modal-box">
          <img src={`/data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} className="w-full" />
          <div className="modal-action">
            <a href={window.location.href.split("#")[0] + '#'} className="btn">Close</a>
          </div>
        </div>
      </div>
      <div id="qq-modal" className="modal">
        <div className="modal-box">
          <img src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} className="w-full" />
          <div className="modal-action">
            <a href={window.location.href.split("#")[0] + '#'} className="btn">Close</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 px-24">
        <div className="col-span-12 py-4">
          <ul className={(window.innerWidth > 640 ? 'horizontal ' : '') + "menu items-stretch px-3 shadow-lg bg-base-100 w-full sm:w-auto rounded-box float-right"}>
            <li className="bordered">
              <a href="/">
                BRIDGEPORT
              </a>
            </li>
            <li>
              {/* could be changed to <a> */}
              <span>About</span>
            </li>
            <li>
              <span>IWAS</span>
            </li>
            <li>
              <span>GWAS</span>
            </li>
            <li>
              <span>Download</span>
            </li>
            <li>
              <span>Software</span>
            </li>
            <li>
              <span>Publication</span>
            </li>
            <li>
              <span>iStaging</span>
            </li>
          </ul>
        </div>
        <h1 className="col-span-12 text-4xl font-bold">BRIDGEPORT: Bridge knowledge across brain imaging, genomics, cognition and pathology</h1>
        <h4 className="col-span-12 text-xl">Browse IWAS, GWAS, and gene-level associations for imaging, cognitive, pathological and clinical traits</h4>
        <form className="col-span-12">
          <div className="form-control my-2">
            <div className="relative">
              <button className="absolute top-0 left-0 rounded-r-none btn btn-primary hidden" ref={backButtonRef} onClick={(e) => {
                for (let i = 0; i < grayedOut.length; i++) {
                  const disabled = grayedOut[i];
                  disabled.getProperty().setOpacity(1);
                  disabled.getProperty().setColor(Math.floor(Math.random() * 255) / 255, Math.floor(Math.random() * 255) / 255, Math.floor(Math.random() * 255) / 255);
                }
                for (let i = 0; i < renderWindows.length; i++) {
                  renderWindows[i].render();
                }
                animateOut(vtkContainerRefs);
                setSearchResults([]);
                setPhenotype('');
                setAtlas(0);
                e.target.parentNode.children[1].classList.remove('pl-24');
                backButtonRef.current.parentNode.children[1].value = '';
              }}>&larr; Back</button>
              <input type="text" placeholder="Search for a variant, gene, or phenotype" className="input input-bordered input-primary w-full" onChange={x => updateMenu(x.target.value)} />
            </div>
          </div>
        </form>
        <div className={searchResults.length > 0 ? "overflow-x-auto overflow-y-auto max-h-80 col-span-12" : "hidden"}>
          <table className="table w-full table-compact">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>P-value</th>
                <th>Beta</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((x, i) => (
                <tr key={i} className="hover cursor-pointer" onClick={() => {
                  setPhenotype(x.IDP);
                  updateMenu(x.IDP);
                  backButtonRef.current.parentNode.children[1].value = x.ID; // set the input value to the ID
                  const atlas = x.IDP.substring(1, x.IDP.indexOf('_'));
                  setAtlas(atlas);
                  animateIn(vtkContainerRefs, atlas, vtkContainerRefs[atlas].current.parentNode.children[1])
                  // make actors grayed out
                  // const actors = renderWindows[i].getRenderers()[0].getActors();
                  const opacity = []
                  for (const k in allActors[atlas]) {
                    if (Object.hasOwnProperty.call(allActors[atlas], k)) {
                      const actor = allActors[atlas][k];
                      if (actor.name === x.IDP && actor.ids !== undefined && actor.ids.includes(x.ID)) {
                        actor.actor.getProperty().setColor(1, 0, 0);
                        actor.actor.getProperty().setOpacity(1);
                      } else {
                        actor.actor.getProperty().setColor(0.5, 0.5, 0.5);
                        actor.actor.getProperty().setOpacity(0.2);
                        opacity.push(actor.actor);
                      }
                    }
                  }
                  for (let i = 0; i < renderWindows.length; i++) {
                    renderWindows[i].render();
                  }
                  setGrayedOut(opacity);
                }}>
                  <td>{x.IDP}</td>
                  <td>{x.ID}</td>
                  <td>{x.P}</td>
                  <td>{x.BETA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* <div ref={vtkContainerRef} className={phenotype.length > 0 ? "col-span-6 w-full max-w-screen-lg" : "col-span-12 w-full max-w-screen-lg"} style={{margin: "0 auto"}} /> */}
        {Object.keys(vtkContainerRefs).map((k => {
          return (
            <div className="col-span-12 sm:col-span-2">
              <div ref={vtkContainerRefs[k]} className="w-full" />
              <button className="btn btn-primary btn-outline btn-block" onClick={(e) => animateIn(vtkContainerRefs, k, e.target)}>Explore C{k}</button>
            </div>
          )
        }))}
        <div className="col-span-5">
          {/* <div className="carousel rounded-box w-full">
          <div className="carousel-item w-full">
            <img className="w-full" src={`/data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} />
          </div>
          <div className="carousel-item w-full">
            <img className="w-full" src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} />
          </div>
        </div> */}
          <p className={(atlas > 0 && phenotype.length === 0) ? "text-center" : "hidden"}>Search or right-click an IDP to see more info.</p>
          <div className={phenotype.length > 0 ? "grid grid-cols-12 gap-1 px-24" : "hidden"}>
            <a className="col-span-12 relative" href={window.location.href.split("#") + '#manhattan-modal'}>
              <svg className="animate-spin h-20 w-20 my-20 text-black absolute" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ zIndex: -1, top: 0, left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <img src={`/data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} className="w-full" />
            </a>
            <a className="col-span-12" href={window.location.href.split("#") + '#qq-modal'}><img src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} className="w-full" /></a>
          </div>
        </div>
      </div>
    </div>
  );

}

export default App;