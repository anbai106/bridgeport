import { useState, useRef, useEffect } from 'react';
// import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkCoordinate from '@kitware/vtk.js/Rendering/Core/Coordinate';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker'
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import 'animate.css';
import GWAS from './data/GWAS.json';

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
  const [searchResults, setSearchResults] = useState([]);
  const [atlas, setAtlas] = useState('');
  const [phenotype, setPhenotype] = useState('');
  const [grayedOut, setGrayedOut] = useState([]);
  const [renderers, setRenderers] = useState([]);
  // const [rotationIntervals, setRotationIntervals] = useState([]);

  const setPhenotypeWrapper = (x) => {
    setPhenotype(x);
    backButtonRef.current.parentNode.children[1].value = x; // set the input value to the phenotype
  };

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

    setRenderers((renderers) => [...renderers, render]);

    // ----------------------------------------------------------------------------
    // Example code
    // ----------------------------------------------------------------------------

    const reader = vtkPolyDataReader.newInstance();
    const allActors = {};
    for (let i = 1; i <= k; i++) {

      reader.setUrl(`/data/MINA/C${k}/C${k}_C${i}.vtk`).then(() => {
        const polydata = reader.getOutputData();
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();

        actor.setMapper(mapper);
        mapper.setInputData(polydata);

        // const texture = vtkTexture.newInstance();
        // texture.setInterpolate(true);
        // texture.setRepeat(true);
        // texture.setInputData(polydata);
        // actor.addTexture(texture);
        // actor.getProperty().setOpacity(0.5);
        // actor.getProperty().setEdgeVisibility(true);
        // actor.getProperty().setLineWidth(2);
        actor.getProperty().setColor(Math.floor(Math.random() * 255) / 255, Math.floor(Math.random() * 255) / 255, Math.floor(Math.random() * 255) / 255);
        // actor.getProperty().setEdgeColor(255 / 255, 87 / 255, 36 / 255);
        // actor.getProperty().setRepresentationToPoints();

        renderer.addActor(actor);

        allActors[JSON.stringify(actor.getBounds())] = `C${k}_${i}`;

        resetCamera();
        renderer.getActiveCamera().zoom(1.8);
        render();
      });

      // // rotate the camera
      // setRotationIntervals(rotationIntervals => [...rotationIntervals, setInterval(() => {
      //   // rotate around focal point
      //   let cam = renderer.getActiveCamera();
      //   cam.roll(0.02);
      //   // cam.yaw(0.1);
      //   // cam.pitch(0.1);
      //   render();
      // }, 200)]);

    }

    // https://kitware.github.io/vtk-js/examples/CellPicker.html
    renderWindow.getInteractor().onRightButtonPress((e) => {
      if (renderer !== e.pokedRenderer) {
        return;
      }
      // get list of actors, set opacity to 0.5
      const actors = renderer.getActors();
      const opacity = [];
      for (let i = 0; i < actors.length; i++) {
        const actor = actors[i];
        actor.getProperty().setColor(0.5, 0.5, 0.5);
        actor.getProperty().setOpacity(0.5);
        opacity.push(actor);
      }
      setGrayedOut(opacity);
      const pos = e.position;
      const picker = vtkCellPicker.newInstance();
      picker.setTolerance(0);
      picker.pick([pos.x, pos.y, 0], renderer);
      const cameraPos = renderer.getActiveCamera().getPosition();
      const largestDim = cameraPos.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0) * 2
      const sortedByDim = picker.getActors().sort((a, b) => (a.getBounds()[largestDim + 1] + a.getBounds()[largestDim]) - (b.getBounds()[largestDim + 1] + b.getBounds()[largestDim])).reverse()
      // console.log(cameraPos, ...picker.getActors().map(a => a.getBounds()), sortedByDim[0].getBounds());
      // const index = (renderer.getActiveCamera().getPosition()[2] > 0) ?  sortedByDim.length - 1 : 0;
      sortedByDim[0].getProperty().setColor(255 / 255, 0 / 255, 0 / 255);
      sortedByDim[0].getProperty().setOpacity(1);
      // picker.getActors().forEach((a) => console.log(a.getBounds(), a.getProperty().getColor(), picker.getPickPosition(), pos.x, pos.y));
      setPhenotypeWrapper(allActors[JSON.stringify(sortedByDim[0].getBounds())]);
      updateMenu(allActors[JSON.stringify(sortedByDim[0].getBounds())]);
      setAtlas(k)
      render(); // necessary to actually change color
      if (vtkContainerRefs[k].current.parentNode.className === 'col-span-12') {
        vtkContainerRefs[k].current.parentNode.className = 'col-span-7'
      }
      if (vtkContainerRefs[k].current.parentNode.className === 'col-span-4') {
        animateIn(vtkContainerRefs, k, vtkContainerRefs[k].current.parentNode.children[1])
        updateMenu(`C${k}`)
      }
    });
  };

  useEffect(() => {
    for (const k in vtkContainerRefs) {
      if (Object.hasOwnProperty.call(vtkContainerRefs, k)) {
        const vtkContainerRef = vtkContainerRefs[k];
        if (k <= 128) {
          renderAtlas(vtkContainerRef, k);
        } else {
          vtkContainerRef.current.innerHTML = `
          <svg class="animate-spin h-20 w-20 my-20 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="margin:0 auto">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>`;
          vtkContainerRef.current.style = "min-height: 300px;padding-top: 50px;";
          setTimeout(() => {
            vtkContainerRef.current.innerHTML = '';
            vtkContainerRef.current.style = "";
            renderAtlas(vtkContainerRef, k);
          }, k * 25);
        }
      }
    }
  }, []);
  // }, [vtkContainerRefs, atlas]);

  const updateMenu = (x) => {
    if (!x) {
      setSearchResults([]);
      return
    }
    const tmp = [];
    const upper = x.toUpperCase()
    for (let i = 0; i < GWAS.length; i++) {
      if (GWAS[i].IDP.startsWith('C' + atlas) && (GWAS[i].ID.toUpperCase().includes(upper) || GWAS[i].IDP.includes(upper))) {
        tmp.push(GWAS[i]);
      }
    }
    setSearchResults(tmp);
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
          el.classList.add('animate__animated', 'animate__bounceOutLeft');
          el.addEventListener('animationend', () => {
            el.classList.add('hidden');
            el.classList.remove('animate__animated', 'animate__bounceOutLeft');
          }, { once: true });
        } else {
          el.classList.add('animate__animated', 'animate__slideInLeft', 'animate__slower', (fullwidth) ? 'col-span-12' : 'col-span-7');
          el.classList.remove('col-span-4');
          el.addEventListener('animationend', () => {
            el.classList.remove('animate__animated', 'animate__slideInLeft', 'animate__slower');
          }, { once: true });
        }
      }
    }
  }

  const animateOut = (refs) => {
    setAtlas('');
    backButtonRef.current.classList.add('hidden');
    for (const key in refs) {
      if (Object.hasOwnProperty.call(refs, key)) {
        const r = refs[key];
        const el = r.current.parentNode;
        if (el.classList.contains('hidden')) {
          el.classList.remove('hidden');
          el.classList.add('animate__animated', 'animate__slideInLeft', 'animate__slower');
          el.addEventListener('animationend', () => {
            el.classList.remove('animate__animated', 'animate__slideInLeft', 'animate__slower');
          }, { once: true });
        } else {
          el.classList.remove('col-span-7', 'col-span-12');
          el.classList.add('col-span-4');
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
            <a href={window.location.href + '#'} className="btn">Close</a>
          </div>
        </div>
      </div>
      <div id="qq-modal" className="modal">
        <div className="modal-box">
          <img src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} className="w-full" />
          <div className="modal-action">
            <a href={window.location.href + '#'} className="btn">Close</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 px-24">
        <div className="navbar my-2 shadow-lg bg-neutral text-neutral-content rounded-box col-span-12">
          <div className="flex-1 px-2 mx-2">
            <span className="text-lg font-bold">
              BRIDGEPORT
            </span>
          </div>
          <div className="flex-none hidden px-2 mx-2 lg:flex">
            <div className="flex items-stretch">
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                About
              </a>
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                IWAS
              </a>
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                GWAS
              </a>
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                Download
              </a>
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                Software
              </a>
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                Publication
              </a>
              <a className="btn btn-ghost btn-sm rounded-btn" href="/">
                iStaging
              </a>
            </div>
          </div>
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
                  for (let i = 0; i < renderers.length; i++) {
                    const render = renderers[i];
                    render();
                  }
                  animateOut(vtkContainerRefs);
                  setSearchResults([]);
                  setPhenotypeWrapper('');
                  setAtlas('');
                  e.target.parentNode.children[1].classList.remove('pl-24');
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
                  setPhenotypeWrapper(x.IDP);
                  let atlas = x.IDP.substring(1, x.IDP.indexOf('_'));
                  setAtlas(atlas);
                  updateMenu(x.IDP);
                  animateIn(vtkContainerRefs, atlas, vtkContainerRefs[atlas].current.parentNode.children[1])
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
            <div className="col-span-4">
              <div ref={vtkContainerRefs[k]} className="w-full" />
              <button className="btn btn-primary w-full" onClick={(e) => animateIn(vtkContainerRefs, k, e.target, true)}>Explore C{k}</button>
            </div>
          )
        }))}
        <div className={phenotype.length > 0 ? "col-span-5" : "hidden"}>
          {/* <div className="carousel rounded-box w-full">
          <div className="carousel-item w-full">
            <img className="w-full" src={`/data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} />
          </div>
          <div className="carousel-item w-full">
            <img className="w-full" src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} />
          </div>
        </div> */}
          <div className="grid grid-cols-12 gap-1 px-24">
            <a className="col-span-12" href={window.location.href + '#manhattan-modal'}><img src={`/data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} className="w-full" /></a>
            <a className="col-span-12" href={window.location.href + '#qq-modal'}><img src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} className="w-full" /></a>
          </div>
        </div>
      </div>
    </div>
  );

}

export default App;