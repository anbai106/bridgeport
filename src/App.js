import { useState, useRef, useEffect } from 'react';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';
// import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkCoordinate from '@kitware/vtk.js/Rendering/Core/Coordinate';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker'
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';

import GWAS from './data/GWAS.json';

function App() {
  const vtkContainerRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [subSearchResults, setSubSearchResults] = useState([]);
  const [atlas, setAtlas] = useState(0);
  const [phenotype, setPhenotype] = useState('');

  useEffect(() => {
    vtkContainerRef.current.innerHTML = '';
    if (atlas === 0) {
      vtkContainerRef.current.innerHTML = '<p style="text-align:center; margin-top:4rem">Select an atlas scale to get started</p>';
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

    // ----------------------------------------------------------------------------
    // Example code
    // ----------------------------------------------------------------------------

    const reader = vtkPolyDataReader.newInstance();
    const allActors = {};
    for (let i = 1; i <= atlas; i++) {

      reader.setUrl(`/data/MINA/C${atlas}/C${atlas}_C${i}.vtk`).then(() => {
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

        allActors[JSON.stringify(actor.getBounds())] = `C${atlas}_${i}`;

        resetCamera();
        renderer.getActiveCamera().zoom(1.8);
        render();
      });


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
      // console.log(cameraPos, ...picker.getActors().map(a => a.getBounds()), sortedByDim[0].getBounds());
      // const index = (renderer.getActiveCamera().getPosition()[2] > 0) ?  sortedByDim.length - 1 : 0;
      sortedByDim[0].getProperty().setColor(0 / 255, 0 / 255, 0 / 255);
      // picker.getActors().forEach((a) => console.log(a.getBounds(), a.getProperty().getColor(), picker.getPickPosition(), pos.x, pos.y));
      setPhenotype(allActors[JSON.stringify(sortedByDim[0].getBounds())]);

      render();
    });

  }, [vtkContainerRef, atlas]);

  const updateMenu = (x) => {
    if (!x) {
      setSearchResults([]);
      return
    }
    const tmp = [];
    for (let i = 0; i < GWAS.length; i++) {
      if (tmp.length > 20) {
        break;
      }
      if (GWAS[i].ID.includes(x) && GWAS[i].IDP.startsWith('C' + atlas)) {
        tmp.push(GWAS[i]);
      }
    }
    setSearchResults(tmp);
  }
  const updateSubMenu = (x, idp) => {
    if (!x) {
      setSubSearchResults([]);
      return
    }
    const tmp = [];
    for (let i = 0; i < GWAS.length; i++) {
      if (tmp.length > 20) {
        break;
      }
      if (GWAS[i].ID.includes(x) && GWAS[i].IDP.startsWith(idp)) {
        tmp.push(GWAS[i]);
      }
    }
    setSubSearchResults(tmp);
  }

  return (
    <div className="grid grid-cols-12 gap-1 px-24">
      <h1 className="col-span-12 text-4xl font-bold">BRIDGEPORT: Bridge knowledge across brain imaging, genomics, cognition and pathology</h1>
      <h4 className="col-span-12 text-xl">Browse IWAS, GWAS, and gene-level associations for imaging, cognitive, pathological and clinical traits</h4>
      <form className="col-span-12">
        <p className="text-right">atlas: {atlas}, IDP: {phenotype}</p>
        <div className="form-control mt-4">
          <select className="select select-bordered w-full" onChange={(e) => setAtlas(e.target.value)} value={atlas}>
            <option disabled={true} value="0">Choose atlas</option>
            <option value="32">32</option>
            <option value="64">64</option>
            <option value="128">128</option>
            <option value="256">256</option>
            <option value="512">512</option>
            <option value="1024">1024</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Top hits:</span>
          </label>
          <input type="text" placeholder="Search for a variant, gene, or phenotype" className="input input-bordered" onChange={x => updateMenu(x.target.value)} />
        </div>
      </form>
      <div className={searchResults.length > 0 ? "overflow-x-auto col-span-12" : "hidden"}>
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
              <tr key={i} className="hover cursor-pointer" onClick={() => setPhenotype(x.IDP)}>
                <td>{x.IDP}</td>
                <td>{x.ID}</td>
                <td>{x.P}</td>
                <td>{x.BETA}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div ref={vtkContainerRef} className={phenotype.length > 0 ? "col-span-6 w-full max-w-screen-lg" : "col-span-12 w-full max-w-screen-lg"} style={{margin: "0 auto"}} />
      <div className={phenotype.length > 0 ? "col-span-6" : "hidden"}>
        <div className="grid grid-cols-12 gap-1 px-24">
          <img src={`/data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} className="col-span-6" style={{ maxHeight: '40vh' }} />
          <img src={`/data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} className="col-span-6" style={{ maxHeight: '40vh' }} />
          <form className="col-span-12">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Top hits:</span>
              </label>
              <input type="text" placeholder="Search for a variant, gene, or phenotype" className="input input-bordered" onChange={x => updateSubMenu(x.target.value, phenotype)} />
            </div>
          </form>
          <div className={subSearchResults.length > 0 ? "overflow-x-auto col-span-12" : "hidden"}>
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
                {subSearchResults.map((x, i) => (
                  <tr key={i} className="hover cursor-pointer">
                    <td>{x.IDP}</td>
                    <td>{x.ID}</td>
                    <td>{x.P}</td>
                    <td>{x.BETA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

}

export default App;