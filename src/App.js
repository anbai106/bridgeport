import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from "react-router-dom";
import { matchSorter } from 'match-sorter'
import axios from 'axios';
import md5 from 'md5'; // for setting color the same as in the python script
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker';
import 'animate.css';
import paginateResults from './utils/paginateResults';
import fancyPlaceholder from './utils/fancyPlaceholder';
import NavBar from './components/NavBar';
import Footer from './components/Footer';


function App() {
  /**
   * Global state
   */
  // react router setup
  const params = useParams();
  const navigate = useNavigate();

  let initialSearchBy = "";
  let initialSearchQuery = "";
  if (params.query !== undefined) {
    initialSearchQuery = params.query
  } else if (params.MINA !== undefined) {
    initialSearchBy = "MINA"
    initialSearchQuery = params.MINA
  } else if (params.MUSE !== undefined) {
    initialSearchBy = "MUSE"
    initialSearchQuery = params.MUSE
  } else if (params.SNP !== undefined) {
    initialSearchBy = "SNP"
    initialSearchQuery = params.SNP
  } else if (params.IWAS !== undefined) {
    initialSearchBy = "IWAS"
    initialSearchQuery = params.IWAS
  } else if (params.geneAnalysis !== undefined) {
    initialSearchBy = "geneAnalysis"
    initialSearchQuery = params.geneAnalysis
  }

  // DOM elements
  const vtkContainerRef = useRef(null); // vtk figure
  const progressRef = useRef(null); // progress bar
  const searchBoxRef = useRef(null); // search box
  const vtkPreviews = { // vtk preview GIFs for each atlas
    32: useRef(null),
    64: useRef(null),
    128: useRef(null),
    256: useRef(null),
    512: useRef(null),
    1024: useRef(null),
  };
  // state
  const [searched, setSearched] = useState(false); // whether the search form's been submitted
  const [searchBy, setSearchBy] = useState(initialSearchBy); // data table to search through
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery); // the actual query
  const [searchSuggestions, setSearchSuggestions] = useState([]); // suggestions for the search query
  const [searchResults, setSearchResults] = useState({ // results of the search
    // double arrays for pagination
    'GWAS': [[]],
    'IWAS': [[]],
    'MUSE': [[]],
    'geneticCorrelation': [[]],
    'geneAnalysis': [[]],
    'heritabilityEstimate': [[]],
  });
  const [phenotype, setPhenotype] = useState(''); // aka MINA e.g. C32_1
  const [atlas, setAtlas] = useState(0); // the 32 in C32_1
  const [typingTimer, setTypingTimer] = useState(null); // auto search timer for suggestions
  const [chartType, setChartType] = useState('manhattan'); // or 'qq'
  const [pagination, setPagination] = useState({ // pagination for the data table
    GWAS: 0,
    IWAS: 0,
    MUSE: 0,
    geneticCorrelation: 0,
    geneAnalysis: 0,
    heritabilityEstimate: 0,
  });
  const [GWAS, setGWAS] = useState([]);
  const [IWAS, setIWAS] = useState([]);
  const [MUSE, setMUSE] = useState([]);
  const [heritabilityEstimate, setHeritabilityEstimate] = useState([]);
  const [geneticCorrelation, setGeneticCorrelation] = useState([]);
  const [geneAnalysis, setGeneAnalysis] = useState([]);

  /**
   * helpers
   */

  const animateOut = () => {
    setAtlas(0);
    setPhenotype('');
    setSearched(false);
    setSearchSuggestions([]);
    setSearchQuery('');
    vtkContainerRef.current.classList.add('animate__animated', 'animate__zoomOutRight');
    vtkContainerRef.current.addEventListener('animationend', () => {
      vtkContainerRef.current.classList.remove('animate__animated', 'animate__zoomOutRight');
      // vtkContainerRef.current.innerHTML = '';
    }, { once: true });
  }

  const greyOut = (target) => { // make actors (except target) grayed out
    const upperTarget = target.toUpperCase();
    const actors = window.renderWindow.getRenderers()[0].getActors();
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i]
      if (actor.getMapper().getInputData().getPointData().getGlobalIds() === upperTarget) {
        actor.getProperty().setColor(153 / 255, 0, 0); // penn red
        actor.getProperty().setOpacity(1);
      } else {
        actor.getProperty().setColor(0.5, 0.5, 0.5);
        actor.getProperty().setOpacity(0.2);
      }
    }
    window.render();
  }

  /**
   * main search function
   * @param {string} q query the query to search for
   * @param {boolean} suggestionsOnly whether to only set suggestions
   * @returns 
   */
  const submitSearch = (q = null, suggestionsOnly = false) => {
    // don't actually start searching until all data loaded
    if (GWAS.length === 0 || IWAS.length === 0 || MUSE.length === 0 || heritabilityEstimate.length === 0 || geneAnalysis.length === 0 || geneticCorrelation.length === 0) {
      return;
    }
    if (q === null) {
      q = searchQuery
    }
    if (q.length === 0 || searched) {
      return;
    }
    console.log('searching for', q)

    const includesAndStartsWith = (str, arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (str.toUpperCase().lastIndexOf(arr[i].toUpperCase(), 0) === 0) {
          return true;
        }
      }
      return false;
    }

    const renderAtlas = (c, cb = null) => {
      vtkContainerRef.current.innerHTML = '';
      progressRef.current.classList.remove('hidden');
      progressRef.current.classList.add("progress", "progress-secondary", "z-50", "col-span-12", "w-full");

      // ----------------------------------------------------------------------------
      // Standard rendering code setup
      // ----------------------------------------------------------------------------

      // const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      //   rootContainer: vtkContainerRef.current,
      // });
      const genericRenderer = vtkGenericRenderWindow.newInstance();

      const renderer = genericRenderer.getRenderer();
      const renderWindow = genericRenderer.getRenderWindow();
      renderer.setBackground(1, 1, 1);
      window.genericRenderer = genericRenderer;
      window.renderWindow = renderWindow;

      const resetCamera = renderer.resetCamera;
      const render = renderWindow.render;
      window.render = render;

      const reader = vtkPolyDataReader.newInstance();
      const functions = [];
      for (let i = 1; i <= c; i++) {
        functions[i - 1] = () => {
          const polydata = reader.getOutputData();
          if (polydata === undefined) { // sometimes the browser will fail to load (as we're requesting files very quickly)
            console.error('failed to load mesh', i);
            if (functions[i - 1] !== undefined) {
              setTimeout(() => {
                functions[i - 1]();
                functions[i - 1] = undefined; // only retry once
              }, 100);
            }
            return;
          }
          const mapper = vtkMapper.newInstance();
          const actor = vtkActor.newInstance();

          actor.setMapper(mapper);
          mapper.setInputData(polydata);

          // actor.getProperty().setEdgeVisibility(true);
          // actor.getProperty().setLineWidth(2);
          // actor.getProperty().setEdgeColor(255 / 255, 87 / 255, 36 / 255);
          // actor.getProperty().setRepresentationToPoints();
          const h1 = parseInt(md5(`C${c}_${i}_r`), 16) / 0xffffffffffffffffffffffffffffffff;
          const h2 = parseInt(md5(`C${c}_${i}_g`), 16) / 0xffffffffffffffffffffffffffffffff;
          const h3 = parseInt(md5(`C${c}_${i}_b`), 16) / 0xffffffffffffffffffffffffffffffff;
          actor.getProperty().setColor(h1, h2, h3);

          renderer.addActor(actor);
          // set id for reference later
          mapper.getInputData().getPointData().setGlobalIds(`C${c}_${i}`);

          resetCamera();
          if (!(atlas > 0 && phenotype.length > 0)) {
            renderer.getActiveCamera().zoom(0.5);
          }
          // let orientation = actor.getOrientation()
          // actor.setOrientation(orientation[0] + 20, orientation[1] + 25, 0);
          // actor.setOrientation(orientation[0], previewRotation, 0);
          // actor.setPosition(0, 350 + ((1/c)*1000), 0);
          progressRef.current.dataset.value++;
          progressRef.current.value = (progressRef.current.dataset.value / c) * 100;
          // make sure types match
          if (parseInt(progressRef.current.dataset.value) === parseInt(c)) {
            // vtkContainerRef.current.children[0].remove()
            vtkContainerRef.current.innerHTML = '';
            // window[`actor${c}`] = actor;
            genericRenderer.setContainer(vtkContainerRef.current);
            render();
            if (cb !== null) {
              cb();
            }
            // const focalPoint = camera.getFocalPoint();
            // camera.setFocalPoint(focalPoint[0], -75 - ((1/c) * 500), focalPoint[2]);
            progressRef.current.value = 0;
            progressRef.current.dataset.value = 0;
            progressRef.current.classList.add('hidden');
            progressRef.current.classList.remove("progress", "progress-secondary", "z-50", "col-span-12", "w-full");
            genericRenderer.resize(); // necessary! to fix blurriness
          }
        }
        reader.setUrl(`data/MINA/C${c}/C${c}_C${i}.vtk`).then(functions[i - 1]);

      }

      // https://kitware.github.io/vtk-js/examples/CellPicker.html
      const highlightCell = (e) => {
        if (renderer !== e.pokedRenderer) {
          return;
        }

        const pos = e.position;
        const picker = vtkCellPicker.newInstance();
        const camera = renderer.getActiveCamera()
        picker.setTolerance(0);
        picker.pick([pos.x, pos.y, 0], renderer);
        if (picker.getActors().length === 0) {
          return;
        }
        const cameraPos = camera.getPosition();
        const largestDim = cameraPos.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0) * 2
        const sortedByDim = picker.getActors().sort((a, b) => (a.getBounds()[largestDim + 1] + a.getBounds()[largestDim]) - (b.getBounds()[largestDim + 1] + b.getBounds()[largestDim])).reverse()
        // const actor = allActors[c][JSON.stringify(sortedByDim[0].getMapper().getInputData().getBounds())];
        const allActors = renderWindow.getRenderers()[0].getActors();
        const actor = allActors.find(a => a.getMapper().getInputData().getPointData().getGlobalIds() === sortedByDim[0].getMapper().getInputData().getPointData().getGlobalIds());
        const actorName = actor.getMapper().getInputData().getPointData().getGlobalIds()
        setPhenotype(actorName);
        setSearchQuery(actorName);
        searchBoxRef.current.value = actorName;
        navigate(`/MINA/${actorName}`);


        // get list of actors, set opacity to 0.5
        const actors = renderer.getActors();
        for (let i = 0; i < actors.length; i++) {
          const actor = actors[i];
          actor.getProperty().setColor(0.5, 0.5, 0.5);
          actor.getProperty().setOpacity(0.2);
        }

        sortedByDim[0].getProperty().setColor(255 / 255, 0 / 255, 0 / 255);
        sortedByDim[0].getProperty().setOpacity(1);
        setAtlas(c)
        window.render(); // necessary to actually change color
      }
      renderWindow.getInteractor().onRightButtonPress(highlightCell);
    }; // end of renderAtlas

    const renderMUSE = (roi) => {
      setAtlas(1);

      vtkContainerRef.current.innerHTML = '';
      vtkContainerRef.current.classList.add('animate__animated', 'animate__zoomInLeft', 'grid', 'grid-cols-12');
      vtkContainerRef.current.parentNode.style = 'bottom: initial;';
      vtkContainerRef.current.classList.remove('col-span-12', 'sm:col-span-2');
      vtkContainerRef.current.addEventListener('animationend', () => {
        vtkContainerRef.current.classList.remove('animate__animated', 'animate__zoomInLeft');
        vtkContainerRef.current.classList.add('grid', 'grid-cols-12');
      }, { once: true });

      // create 6 renderers for each of the MINA atlases
      [32, 64, 128, 256, 512, 1024].forEach(c => {
        const vtkPanel = document.createElement('div');
        vtkPanel.classList.add('col-span-12', 'sm:col-span-2');
        vtkPanel.style.zIndex = 100;
        vtkContainerRef.current.appendChild(vtkPanel);
        const genericRenderer = vtkGenericRenderWindow.newInstance();
        const renderer = genericRenderer.getRenderer();
        const renderWindow = genericRenderer.getRenderWindow();
        const render = renderWindow.render;
        renderer.setBackground(1, 1, 1);
        genericRenderer.setContainer(vtkPanel);

        const reader = vtkPolyDataReader.newInstance();
        // load MINA parcellation associated with MUSE ROI
        const k = `MINA_C${c}_mapped`;
        const fullC = `C${c}_${roi[k]}`;
        reader.setUrl(`/bridgeport/data/MINA/C${c}/${fullC}.vtk`).then(() => {
          const polydata = reader.getOutputData();
          const mapper = vtkMapper.newInstance();
          const actor = vtkActor.newInstance();
          actor.setMapper(mapper);
          mapper.setInputData(polydata);
          actor.getProperty().setColor(1, 0, 0);
          renderer.addActor(actor);
          renderer.resetCamera();
        });
        // load full MINA atlas to show position of parcellation
        reader.setUrl(`/bridgeport/data/MINA/C${c}/C${c}_all.vtk`).then(() => {
          const polydata = reader.getOutputData();
          const mapper = vtkMapper.newInstance();
          const actor = vtkActor.newInstance();
          actor.setMapper(mapper);
          mapper.setInputData(polydata);
          actor.getProperty().setColor(0.5, 0.5, 0.5);
          actor.getProperty().setOpacity(0.2);
          renderer.addActor(actor);
          renderer.getActiveCamera().zoom(1);
        });
        setTimeout(render, 1000);
      });

      // load MUSE vtk
      const vtkPanel = document.createElement('div');
      vtkPanel.classList.add('col-span-12', 'relative');
      vtkPanel.id = 'muse-vtk';
      vtkPanel.style.bottom = 'calc(30vw - 100px)';
      vtkContainerRef.current.appendChild(vtkPanel);
      const genericRenderer = vtkGenericRenderWindow.newInstance();
      const renderer = genericRenderer.getRenderer();
      const renderWindow = genericRenderer.getRenderWindow();
      const render = renderWindow.render;
      renderer.setBackground(1, 1, 1);
      genericRenderer.setContainer(vtkPanel);
      const reader = vtkPolyDataReader.newInstance();
      reader.setUrl(`/bridgeport/data/MUSE/MUSE_${roi.TISSUE_SEG}_${roi.ROI_INDEX}.vtk`).then(() => {
        const polydata = reader.getOutputData();
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        mapper.setInputData(polydata);
        actor.getProperty().setColor(1, 0, 0);
        renderer.addActor(actor);
        renderer.resetCamera();
        renderer.getActiveCamera().zoom(0.7);
        setTimeout(render, 2000);
      });
      // overlay whole MINA atlas
      reader.setUrl(`/bridgeport/data/MINA/C32/C32_all.vtk`).then(() => {
        const polydata = reader.getOutputData();
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        mapper.setInputData(polydata);
        actor.getProperty().setColor(0.5, 0.5, 0.5);
        actor.getProperty().setOpacity(0.2);
        renderer.addActor(actor);
        setTimeout(render, 2000);
      });
    }

    const matches = {
      'GWAS': [[]],
      'IWAS': [[]],
      'MUSE': [[]],
      'geneticCorrelation': [[]],
      'geneAnalysis': [[]],
      'heritabilityEstimate': [[]],
    };
    if (searchBy === 'MINA' || (q.toUpperCase().startsWith('C') && searchBy === '')) {
      // need to search everything (gene analysis, heritability estimates, genetic correlation, GWAS and IWAS)
      matches['GWAS'] = matchSorter(GWAS, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.P) - parseFloat(b.item.P)
          });
        }
      });
      matches['IWAS'] = matchSorter(IWAS, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.Pvalue) - parseFloat(b.item.Pvalue)
          });
        }
      });
      matches['geneAnalysis'] = matchSorter(geneAnalysis, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.P) - parseFloat(b.item.P)
          });
        }
      });
      matches['geneticCorrelation'] = matchSorter(geneticCorrelation, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.P) - parseFloat(b.item.P)
          });
        }
      });
      matches['heritabilityEstimate'] = matchSorter(heritabilityEstimate, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.Heritability) - parseFloat(b.item.Heritability)
          });
        }
      });
      if (q.indexOf('_') === -1) { // Cx
        setSearchSuggestions(['C32_', 'C64_', 'C128_', 'C256_', 'C512_', 'C1024_']);
        return;
      } else if (q.endsWith('_')) { // Cx_
        setSearchSuggestions([...Array(parseInt(q.toUpperCase().replace('C', '').replace('_', ''))).keys()].map(i => `${q.toUpperCase()}${i + 1}`));
        return;
      } else { // Cx_y
        const parts = q.toUpperCase().split('_');
        const scaleC = parseInt(parts[0].replace('C', ''))
        setSearchSuggestions([...Array(scaleC).keys()].map(i => `${parts[0]}_${i + 1}`));
        // animate in and highlight target
        if (!suggestionsOnly) {
          if (scaleC === atlas) {
            greyOut(q);
          } else {
            setAtlas(scaleC);
            vtkContainerRef.current.classList.add('animate__animated', 'animate__zoomInLeft');
            vtkContainerRef.current.classList.remove('col-span-12', 'sm:col-span-2', 'grid', 'grid-cols-12');
            vtkContainerRef.current.addEventListener('animationend', () => {
              vtkContainerRef.current.classList.remove('animate__animated', 'animate__zoomInLeft');
            }, { once: true });
            renderAtlas(scaleC, () => greyOut(q));
          }
        }
      }
    } else if (searchBy === 'SNP' || (q.startsWith('rs') && searchBy === '')) {
      // only need to search GWAS
      matches['GWAS'] = matchSorter(GWAS, q, {
        keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'ID' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.P) - parseFloat(b.item.P)
          })
        }
      });
      setSearchSuggestions(matches['GWAS'].map(item => item.ID).filter((value, index, self) => self.indexOf(value) === index));
    } else if (searchBy === 'IWAS' || (searchBy === '' && includesAndStartsWith(q, [...new Set(IWAS.map(d => d.trait))]))) {
      // only need to search IWAS
      matches['IWAS'] = matchSorter(IWAS, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'trait' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.Pvalue) - parseFloat(b.item.Pvalue)
          })
        }
      });
      // IWAS suggestions should be fuzzy (results are exact match)
      const iwasSuggestions = matchSorter(IWAS, q, {
        keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'trait' }]
      }).map(item => item.trait).filter((value, index, self) => self.indexOf(value) === index)
      setSearchSuggestions(iwasSuggestions);
    } else if (searchBy === 'MUSE' || (searchBy === '' && includesAndStartsWith(q, [...new Set(MUSE.map(d => d.ROI_NAME))]))) {
      // only need to search MUSE
      matches['MUSE'] = matchSorter(MUSE, q, {
        keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'ROI_NAME' }]
      });
      const museSuggestions = matchSorter(MUSE, q, {
        keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'ROI_NAME' }]
      }).map(item => item.ROI_NAME).filter((value, index, self) => self.indexOf(value) === index)
      setSearchSuggestions(museSuggestions);
      if (!suggestionsOnly && matches['MUSE'].length === 1) {
        renderMUSE(matches['MUSE'][0]);
      }
    } else { // presumably a gene symbol
      // only need to search gene analysis
      matches['geneAnalysis'] = matchSorter(geneAnalysis, q, {
        keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'GENE' }],
        sorter: rankedItems => {
          return rankedItems.sort((a, b) => {
            return parseFloat(a.item.P) - parseFloat(b.item.P)
          })
        }
      });
      setSearchSuggestions(matches['geneAnalysis'].map(item => item.GENE).filter((value, index, self) => self.indexOf(value) === index));
    }
    if (!suggestionsOnly) {
      setSearchResults(paginateResults(matches, 10));
    }
    if (!suggestionsOnly) {
      setPagination({
        GWAS: 0,
        IWAS: 0,
        MUSE: 0,
        geneticCorrelation: 0,
        geneAnalysis: 0,
        heritabilityEstimate: 0,
      });
      setSearched(true);
    }
    // else {
    //   setSearched(false);
    // }
  } // end of submitSearch

  // search when search query changes
  useEffect(submitSearch, [searchQuery]);

  // load data
  useEffect(() => {
    axios.get("data/json/GWAS.json").then(res => setGWAS(res.data));
    axios.get("data/json/IWAS.json").then(res => setIWAS(res.data));
    axios.get("data/json/MUSE.json").then(res => setMUSE(res.data));
    axios.get("data/json/heritability_estimate.json").then(res => setHeritabilityEstimate(res.data));
    axios.get("data/json/gene_analysis.json").then(res => setGeneAnalysis(res.data));
    axios.get("data/json/genetic_correlation.json").then(res => setGeneticCorrelation(res.data));
  }, []);

  // navigate to homepage when navigate("/") is called
  useEffect(() => {
    if (Object.keys(params).length === 0) {
      animateOut();
      setSearched(false);
      setSearchBy('');
      searchBoxRef.current.value = '';
    }
  }, [params]);


  return (
    <div className="min-h-full">

      {/* 15rem = height of footer */}
      <div className="grid main-container grid-cols-12 auto-rows-max gap-1 px-2 sm:px-24 mb-4" style={!searched ? { minHeight: 'calc(100% - 15rem)' } : { minHeight: '100%' }}>
        <div className="col-span-12 py-4">
          <NavBar />
        </div>
        <h1 className="col-span-12 text-3xl font-bold">BRIDGEPORT: Bridge knowledge across brain imaging, genomics, and clinical phenotypes</h1>
        <h4 className="col-span-12 text-base">MINA is a multi-scale atlas that parcellates the human brain by structural covariance in MRI data over the lifespan and a wide range of disease populations. BRIDGEPORT allows you to interactively browse the atlas in a 3D view and explore the phenotypic landscape and genetic architecture of the human brain. This web portal aims to foster multidisciplinary crosstalk across neuroimaging, machine learning, and genetic communities.</h4>
        {/* data-value is the number of actors loaded, value is the % */}
        <progress className="hidden" style={{ marginBottom: '70vh' }} data-value="0" value="0" min="0" max="100" ref={progressRef}></progress>
        <div className={atlas > 0 && phenotype.length > 0 ? "col-span-8 z-10 relative" : "hidden"}>
          <div className="tabs">
            <button onClick={() => setChartType('manhattan')} className={chartType === 'manhattan' ? "tab tab-bordered tab-active" : "tab tab-bordered"}>Manhattan</button>
            <button onClick={() => setChartType('qq')} className={chartType === 'qq' ? "tab tab-bordered tab-active" : "tab tab-bordered"}>QQ</button>
          </div>
          <img onAnimationEnd={e => e.animationName === 'bounceOutLeft' ? e.target.classList.add('hidden') : e.target.classList.remove('hidden')} className={(phenotype.length > 0 && chartType === 'manhattan' ? 'animate__animated animate__bounceInLeft' : 'animate__animated animate__bounceOutLeft') + ' w-full absolute'} src={`data/plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} />
          <img onAnimationEnd={e => e.animationName === 'bounceOutLeft' ? e.target.classList.add('hidden') : e.target.classList.remove('hidden')} className={(phenotype.length > 0 && chartType === 'qq' ? 'animate__animated animate__bounceInLeft' : 'animate__animated animate__bounceOutLeft') + ' max-w-xl max-h-full absolute'} src={`data/plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} style={{ left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto' }} />
        </div>
        <div className={atlas > 0 ? (phenotype.length === 0 ? "col-span-12 -z-50 w-100 overflow-hidden" : "col-span-4") : "hidden"} style={{ maxHeight: '70vh' }}>
          <div style={phenotype.length === 0 ? { bottom: 'calc(30vw - 100px)' } : {}} className="-z-40 h-full relative">
            <div className={atlas > 0 && phenotype.length === 0 ? "-z-30 animate__animated animate__bounceInDown" : "max-w-lg -z-30 animate__animated animate__bounceInLeft"} ref={vtkContainerRef} />
          </div>
        </div>
        <p className={atlas > 0 && phenotype.length === 0 ? "-mb-4 -mt-8 z-50 text-right col-span-12 text-gray-500" : "hidden"}>Right click a parcellation to reveal statistics</p>
        {Object.keys(vtkPreviews).map((c => {
          return (
            <div className={atlas > 0 ? "hidden" : "col-span-12 sm:col-span-2"} ref={vtkPreviews[c]} key={c}>
              <video autoPlay={true} loop={true} muted={true} playsInline={true} className="w-full animate__animated animate__bounceInDown">
                <source src={`data/webm/C${c}.webm`} type="video/webm" />
                <source src={`data/mp4/C${c}.mp4`} type="video/mp4" />
              </video>
              <Link to={"/C/" + c} className="btn btn-primary btn-block btn-sm">3D View C{c}</Link>
            </div>
          )
        }))}
        <p className={phenotype.length > 0 ? chartType === 'qq' ? "col-span-12 text-right z-50" : "col-span-12 text-right md:-mt-10 z-50" : "hidden"}><button className="btn btn-link btn-sm" onClick={() => {
          const actors = window.renderWindow.getRenderers()[0].getActors();
          for (let i = 0; i < actors.length; i++) {
            const disabled = actors[i];
            disabled.getProperty().setOpacity(1);
            const h1 = parseInt(md5(`C${atlas}_${i}_r`), 16) / 0xffffffffffffffffffffffffffffffff;
            const h2 = parseInt(md5(`C${atlas}_${i}_g`), 16) / 0xffffffffffffffffffffffffffffffff;
            const h3 = parseInt(md5(`C${atlas}_${i}_b`), 16) / 0xffffffffffffffffffffffffffffffff;
            disabled.getProperty().setColor(h1, h2, h3);
          }
          setPhenotype('');
          window.render();
          window.genericRenderer.resize();
        }}>Reset selection</button>.</p>
        <form className={atlas > 0 && phenotype.length === 0 ? "hidden" : "col-span-12"} onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          if (typingTimer !== null) {
            clearTimeout(typingTimer);
          }
          setTypingTimer(null);
          const searchBox = e.target.querySelector('input');
          setSearchQuery(searchBox.value);
          navigate(`/${searchBy === '' ? 'search' : searchBy}/${searchBox.value}`);
        }}>
          <div className="form-control my-2">
            <div className="relative">
              <button type="button" className={(searched ? "" : "hidden") + " sm:absolute sm:w-28 w-full top-0 left-0 sm:rounded-r-none sm:mb-0 mb-2 btn btn-primary"} onClick={(e) => {
                e.preventDefault();
                navigate('/');
                animateOut();
                setSearched(false);
                setSearchBy('');
              }}>&larr; Back</button>
              <select className={"select select-bordered select-primary sm:rounded-r-none sm:absolute sm:w-auto w-full mb-2 sm:mb-0 top-0 " + (searched ? "left-24" : "left-0")} onChange={x => setSearchBy(x.target.value)}>
                <option selected={searchBy === '' || searchBy === 'search'} value="">Search by</option>
                <option selected={searchBy === 'MINA'} value="MINA">MINA</option>
                <option selected={searchBy === 'SNP'} value="SNP">SNP</option>
                <option selected={searchBy === 'geneAnalysis'} value="geneAnalysis">Gene symbol</option>
                <option selected={searchBy === 'IWAS'} value="IWAS">Clinical traits</option>
                <option selected={searchBy === 'MUSE'} value="MUSE">MUSE</option>
              </select>

              <input type="text" placeholder={fancyPlaceholder(searchBy)} className={(searched ? "sm:pl-64" : "sm:pl-40") + " input input-bordered input-primary w-full mb-2 sm:mb-0"} ref={searchBoxRef} onChange={x => {
                // wait to see if the user has stopped typing
                if (typingTimer !== null) {
                  clearTimeout(typingTimer);
                }
                const timeout = setTimeout(() => {
                  submitSearch(x.target.value, true);
                  setTypingTimer(null);
                  setSearched(false);
                }, 900);
                setTypingTimer(timeout);
              }} />
              <button type="submit" className="sm:absolute top-0 right-0 sm:rounded-l-none sm:w-auto w-full btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
              <ul tabIndex="0" className={searchSuggestions.length > 0 && !searched ? 'p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-full max-h-96 overflow-y-scroll' : 'hidden'}>
                {searchSuggestions.map((x, i) => {
                  return (
                    <li key={i} className="hover:bg-primary-100 z-50">
                      <button onClick={(e) => {
                        e.preventDefault();
                        searchBoxRef.current.value = x;
                        navigate(`/${searchBy === '' ? 'search' : searchBy}/${x}`);
                        setSearchQuery(x);
                      }
                      } className="btn-ghost text-left inline w-fit normal-case font-medium">{x}</button>
                    </li>
                  );
                })}

              </ul>
            </div>
          </div>
        </form>

        <div className={searched ? "hidden" : "alert col-span-12 mb-8 shadow"}>
          <div className="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2196f3" className="w-6 h-6 mx-2">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <label>
              <h4>Bridgeport allows us to browse the results of PSC-wide association studies and genome-wide association studies. It currently supports the following searching criteria:</h4>
              <ul className="list-disc text-sm text-base-content text-opacity-60 pl-8">
                <li>MINA PSC: users can search by patterns of structural covariance (PSC) defined by MINA. One PSC represents a brain region that is driven by structural covariance in imaging data.</li>
                <li>SNP: users can search by single nucleotide polymorphism. We currently only include common genetic variants of the human genome.</li>
                <li>Gene symbol: users can search by gene symbols. Gene annotation is performed to map the SNPs from Phase 3 of 1000 Genomes to genes based on the GRCh37 build.</li>
                <li>Clinical traits: users can search by clinical traits. We performed PSC-wide association studies and genetic correlation analyses for various clinical phenotypes.</li>
                <li>MUSE: users can also search by traditional brain anatomy terminology, e.g., left hippocampus. Here we map each brain region of the MUSE atlas to the nearest MINA PSC.</li>
              </ul>
            </label>
          </div>
        </div>

        {Object.keys(pagination).map(table => (
          // since col-span-6 and col-span-12 classes are set via concatenation, purgeCSS won't see it so those classes have to be set in safelist
          <div className={searched && searchResults[table][0] !== undefined && searchResults[table][0].length > 0 ? "overflow-x-auto overflow-y-hidden max-h-96 col-span-" + (((searchResults['GWAS'][0] !== undefined && searchResults['GWAS'][0].length > 0) + (searchResults['IWAS'][0] !== undefined && searchResults['IWAS'][0].length > 0) + (searchResults['geneAnalysis'][0] !== undefined && searchResults['geneAnalysis'][0].length > 0) + (searchResults['geneticCorrelation'][0] !== undefined && searchResults['geneticCorrelation'][0].length > 0) + (searchResults['MUSE'][0] !== undefined && searchResults['MUSE'][0].length > 0)) > 2 ? '6' : '12') : "hidden"}>
            <h4 className="font-bold text-xl inline">{table === 'geneAnalysis' ? 'Gene analysis' : table === 'heritabilityEstimate' ? 'Heritability estimate' : table === 'geneticCorrelation' ? 'Genetic correlation' : table}</h4>
            <div className="badge badge-primary badge-sm ml-2 relative bottom-1">{searchResults[table].flat(Infinity).length} results</div>
            <div className="inline btn-group float-right">
              <button className={"btn btn-xs" + (pagination[table] === 0 ? ' btn-disabled' : '')} onClick={(e) => {
                switch (table) {
                  case 'GWAS':
                    setPagination({
                      GWAS: pagination.GWAS - 1,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'IWAS':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS - 1,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'MUSE':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE - 1,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneticCorrelation':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation - 1,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneAnalysis':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis - 1,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'heritabilityEstimate':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate - 1,
                    });
                    break;
                  default:
                    console.error('Unknown table: ' + table);
                    break;
                }
              }}>«</button>
              {[...Array(Math.min(searchResults[table].length, 4)).keys()].map(x => (
                <button className={"btn btn-xs" + (x === Math.min(pagination[table], 2) ? " btn-active" : '')} onClick={(e) => {
                  switch (table) {
                    case 'GWAS':
                      setPagination({
                        // offset + current_page then subtract min(current_page, 2) to show prev pages
                        GWAS: x + pagination.GWAS - Math.min(pagination.GWAS, 2),
                        IWAS: pagination.IWAS,
                        MUSE: pagination.MUSE,
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'IWAS':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: x + pagination.IWAS - Math.min(pagination.IWAS, 2),
                        MUSE: pagination.MUSE,
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'MUSE':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
                        MUSE: x + pagination.MUSE - Math.min(pagination.MUSE, 2),
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'geneticCorrelation':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
                        MUSE: pagination.MUSE,
                        geneticCorrelation: x + pagination.geneticCorrelation - Math.min(pagination.geneticCorrelation, 2),
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'geneAnalysis':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
                        MUSE: pagination.MUSE,
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: x + pagination.geneAnalysis - Math.min(pagination.geneAnalysis, 2),
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'heritabilityEstimate':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
                        MUSE: pagination.MUSE,
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: x + pagination.heritabilityEstimate - Math.min(pagination.heritabilityEstimate, 2),
                      });
                      break;
                    default:
                      console.error('Unknown table: ' + table);
                      break;
                  }
                }} key={x}>{1 + x + pagination[table] - Math.min(pagination[table], 2)}</button>
              ))}
              <button className={"btn btn-xs" + (pagination[table] === searchResults[table].length - 1 ? ' btn-disabled' : '')} onClick={(e) => {
                switch (table) {
                  case 'GWAS':
                    setPagination({
                      GWAS: pagination.GWAS + 1,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'IWAS':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS + 1,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'MUSE':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE + 1,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneticCorrelation':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation + 1,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneAnalysis':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis + 1,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'heritabilityEstimate':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      MUSE: pagination.MUSE,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate + 1,
                    });
                    break;
                  default:
                    console.error('Unknown table: ' + table);
                    break;
                }
              }}>»</button>
            </div>
            <table className="table w-full table-compact">
              <thead>
                {table === 'GWAS' ? <tr><th></th><th>ID</th><th>P-value</th><th>Beta</th></tr> :
                  table === 'IWAS' ? <tr><th></th><th>Trait</th><th>P-value</th><th>ES</th></tr> :
                    table === 'MUSE' ? <tr><th>ROI</th><th>Tissue</th></tr> :
                      table === 'geneticCorrelation' ? <tr><th></th><th>Trait</th><th>Mean</th><th>Std. Dev.</th><th>P-value</th></tr> :
                        table === 'geneAnalysis' ? <tr><th></th><th>Gene</th><th>Chromosome</th><th>Start - Stop</th><th>NSNPS</th><th>NPARAM</th><th>N</th><th>Z Stat</th><th>P-value</th></tr> :
                          table === 'heritabilityEstimate' ? <tr><th></th><th>Heritability</th><th>P-value</th></tr> :
                            <div>Error: unknown table {table}</div>}
              </thead>
              <tbody>
                {searchResults[table][pagination[table]] === undefined ? <tr></tr> : searchResults[table][pagination[table]].map((x, i) => {
                  switch (table) {
                    case 'GWAS':
                      return (
                        <tr key={i} className="hover">
                          <td>{x.IDP}</td><td>{x.ID}</td><td>{x.P}</td><td>{x.BETA}</td>
                        </tr>
                      );
                    case 'IWAS':
                      return (
                        <tr key={i} className="hover">
                          <td>{x.IDP}</td><td>{x.trait}</td><td>{x.Pvalue}</td><td>{x.ES}</td>
                        </tr>
                      );
                    case 'MUSE':
                      return (
                        <tr key={i} className="hover">
                          <td>{x.ROI_NAME}</td><td>{x.TISSUE_SEG}</td>
                        </tr>
                      );
                    case 'geneticCorrelation':
                      return (
                        <tr key={i} className="hover">
                          <td>{x.IDP}</td><td>{x.trait}</td><td>{x.gc_mean}</td><td>{x.gc_std}</td><td>{x.P}</td>
                        </tr>
                      );
                    case 'geneAnalysis':
                      return (
                        <tr key={i} className="hover">
                          <td>{x.IDP}</td><td>{x.GENE}</td><td>{x.CHR}</td><td>{x.START} - {x.STOP}</td><td>{x.NSNPS}</td><td>{x.NPARAM}</td><td>{x.N}</td><td>{x.ZSTAT}</td><td>{x.P}</td>
                        </tr>
                      );
                    case 'heritabilityEstimate':
                      return (
                        <tr key={i} className="hover">
                          <td>{x.IDP}</td><td>{x.Heritability}</td><td>{x.Pvalue}</td>
                        </tr>
                      );
                    default:
                      return <div>Error: unknown table {table}</div>;
                  }
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );

}

export default App;