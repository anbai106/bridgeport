import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from "react-router-dom";
import { matchSorter } from 'match-sorter'
import md5 from 'md5'; // for setting color the same as in the python script
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker';
import 'animate.css';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

// data imports
import GWAS from './data/GWAS.json';
import IWAS from './data/IWAS.json';
import heritabilityEstimate from './data/heritability_estimate.json';
import geneticCorrelation from './data/genetic_correlation.json';
import geneAnalysis from './data/gene_analysis.json';

// organize data for later
const GWASByAtlas = GWAS.reduce((acc, curr) => {
  const atlas = curr.IDP.substring(1, curr.IDP.indexOf('_'));
  if (!(atlas in acc)) {
    acc[atlas] = [];
  }
  acc[atlas].push(curr);
  return acc;
}, {});
const IWASByAtlas = IWAS.reduce((acc, curr) => {
  const atlas = curr.IDP.substring(1, curr.IDP.indexOf('_'));
  if (!(atlas in acc)) {
    acc[atlas] = [];
  }
  acc[atlas].push(curr);
  return acc;
}, {});
const geneAnalysisByAtlas = geneAnalysis.reduce((acc, curr) => {
  const atlas = curr.IDP.substring(1, curr.IDP.indexOf('_'));
  if (!(atlas in acc)) {
    acc[atlas] = [];
  }
  acc[atlas].push(curr);
  return acc;
}, {});
const geneticCorrelationByAtlas = geneticCorrelation.reduce((acc, curr) => {
  const atlas = curr.IDP.substring(1, curr.IDP.indexOf('_'));
  if (!(atlas in acc)) {
    acc[atlas] = [];
  }
  acc[atlas].push(curr);
  return acc;
}, {});
const heritabilityEstimateByAtlas = heritabilityEstimate.reduce((acc, curr) => {
  const atlas = curr.IDP.substring(1, curr.IDP.indexOf('_'));
  if (!(atlas in acc)) {
    acc[atlas] = [];
  }
  acc[atlas].push(curr);
  return acc;
}, {});
const max_hash = 0xffffffffffffffffffffffffffffffff;
const clinical_traits = [...new Set(IWAS.map(d => d.trait))];


function App() {
  // global state
  const params = useParams();
  const navigate = useNavigate();
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
  const [searched, setSearched] = useState(false); // whether the search form's been submitted
  const [searchBy, setSearchBy] = useState(''); // data table to search through
  const [searchQuery, setSearchQuery] = useState(''); // the actual query
  const [searchSuggestions, setSearchSuggestions] = useState([]); // suggestions for the search query
  const [searchResults, setSearchResults] = useState({ // results of the search
    // double arrays for pagination
    'GWAS': [[]],
    'IWAS': [[]],
    'geneticCorrelation': [[]],
    'geneAnalysis': [[]],
    'heritabilityEstimate': [[]],
  });
  const [phenotype, setPhenotype] = useState(''); // aka IDP e.g. C32_1
  const [atlas, setAtlas] = useState(0); // the 32 in C32_1
  const [typingTimer, setTypingTimer] = useState(null); // auto search timer for suggestions
  const [chartType, setChartType] = useState('manhattan'); // or 'qq'
  const [pagination, setPagination] = useState({ // pagination for the data table
    GWAS: 0,
    IWAS: 0,
    geneticCorrelation: 0,
    geneAnalysis: 0,
    heritabilityEstimate: 0,
  });

  // helpers
  const paginateResults = (results, perPage) => {
    const paginatedResults = {
      // double arrays for pagination
      'GWAS': [[]],
      'IWAS': [[]],
      'geneticCorrelation': [[]],
      'geneAnalysis': [[]],
      'heritabilityEstimate': [[]],
    };
    for (const k in results) {
      if (Object.hasOwnProperty.call(results, k)) {
        let page = 0;
        for (let i = 0; i < results[k].length; i++) {
          if (paginatedResults[k][page] === undefined) {
            paginatedResults[k][page] = [];
          }
          const searchResult = results[k][i];
          paginatedResults[k][page].push(searchResult);
          if (paginatedResults[k][page].length === perPage) {
            page += 1;
          }
        }
      }
    }
    return paginatedResults;
  };

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
        const h1 = parseInt(md5(`C${c}_${i}_r`), 16) / max_hash;
        const h2 = parseInt(md5(`C${c}_${i}_g`), 16) / max_hash;
        const h3 = parseInt(md5(`C${c}_${i}_b`), 16) / max_hash;
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
      navigate(`/IDP/${actorName}`);


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
      // if (vtkContainerRefs[c].current.parentNode.className === 'col-span-12') {
      //   vtkContainerRefs[c].current.parentNode.className = 'col-span-4'
      // }
      // if (vtkContainerRefs[c].current.parentNode.className === 'col-span-12 sm:col-span-2') {
      //   animateIn(c, vtkContainerRefs[c].current.parentNode.children[1])
      //   setSearchQuery(`C${c}`)
      // }
    }
    renderWindow.getInteractor().onRightButtonPress(highlightCell);
  }; // end of renderAtlas

  const animateIn = (c, cb = null) => {
    setAtlas(c);
    renderAtlas(c, cb);
    setSearched(true);

    vtkContainerRef.current.classList.add('animate__animated', 'animate__zoomInLeft');
    vtkContainerRef.current.classList.remove('col-span-12', 'sm:col-span-2');
    vtkContainerRef.current.addEventListener('animationend', () => {
      vtkContainerRef.current.classList.remove('animate__animated', 'animate__zoomInLeft');
    }, { once: true });
  }

  const animateOut = () => {
    setAtlas(0);
    setPhenotype('');
    setSearched(false);
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

  const submitSearch = (searchBox) => {
    setSearched(true);
    setSearchSuggestions([]);
    setSearchQuery(searchBox);
    let searchedAtlas = atlas;
    if (searchBox.toUpperCase().startsWith('C')) { // started typing IDP
      if (searchBox.indexOf('_') > 0 && !isNaN(parseInt(searchBox.split('_')[1]))) { // typed full IDP
        setPhenotype(searchBox.toUpperCase());
        searchedAtlas = searchBox.substring(1, searchBox.indexOf('_')); // extract between C and _
        if (searchedAtlas === atlas) {
          greyOut(searchBox);
        } else { // animate in different atlas
          animateIn(searchedAtlas, () => greyOut(searchBox));
        }
      } else { // typed only Cx
        setSearched(false);
        return;
      }
    } else if (atlas > 0) { // only searching for IDP shows vtk figure, manhattan / qq plots
      animateOut();
    }
  }

  const fancyPlaceholder = searchBy => {
    switch (searchBy) {
      case 'IDP':
        return 'Type Cx_y to search for a phenotype';
      case 'SNP':
        return 'Search for a SNP e.g. rs123456789';
      case 'IWAS':
        return 'Search for a clinical trait e.g. AD';
      case 'geneAnalysis':
        return 'Search for a gene symbol e.g. RUNX2';
      default:
        return "Search for a variant, gene, or phenotype";
    }
  }

  // search when search query changes
  useEffect(() => {
    const includesAndStartsWith = (str, arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (str.toUpperCase().startsWith(arr[i].toUpperCase())) {
          return true;
        }
      }
      return false;
    }
    const matches = {
      'GWAS': [[]],
      'IWAS': [[]],
      'geneticCorrelation': [[]],
      'geneAnalysis': [[]],
      'heritabilityEstimate': [[]],
    };
    if (searchQuery.length === 0) {
      setSearchResults(matches);
    } else {
      if (searchBy === 'IDP' || (searchQuery.toUpperCase().startsWith('C') && searchBy === '')) {
        // need to search everything (gene analysis, heritability estimates, genetic correlation, GWAS and IWAS)
        matches['GWAS'] = matchSorter(atlas > 0 ? GWASByAtlas[atlas] : GWAS, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.P) - parseFloat(a.item.P)
            });
          }
        });
        matches['IWAS'] = matchSorter(atlas > 0 ? IWASByAtlas[atlas] : IWAS, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.Pvalue) - parseFloat(a.item.Pvalue)
            });
          }
        });
        matches['geneAnalysis'] = matchSorter(atlas > 0 ? geneAnalysisByAtlas[atlas] : geneAnalysis, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.P) - parseFloat(a.item.P)
            });
          }
        });
        matches['geneticCorrelation'] = matchSorter(atlas > 0 ? geneticCorrelationByAtlas[atlas] : geneticCorrelation, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.P) - parseFloat(a.item.P)
            });
          }
        });
        matches['heritabilityEstimate'] = matchSorter(atlas > 0 ? heritabilityEstimateByAtlas[atlas] : heritabilityEstimate, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'IDP' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.Heritability) - parseFloat(a.item.Heritability)
            });
          }
        });
        let suggestions = []
        if (searchQuery.indexOf('_') === -1) { // Cx
          suggestions = ['C32_', 'C64_', 'C128_', 'C256_', 'C512_', 'C1024_']
        } else if (searchQuery.endsWith('_')) { // Cx_
          suggestions = [...Array(parseInt(searchQuery.toUpperCase().replace('C', '').replace('_', ''))).keys()].map(i => `${searchQuery.toUpperCase()}${i + 1}`);
        } else { // Cx_y
          const parts = searchQuery.toUpperCase().split('_');
          suggestions = [...Array(parseInt(parts[0].replace('C', ''))).keys()].map(i => `${parts[0]}_${i + 1}`);
        }
        setSearchSuggestions(suggestions);
      } else if (searchBy === 'SNP' || (searchQuery.startsWith('rs') && searchBy === '')) {
        // only need to search GWAS
        matches['GWAS'] = matchSorter(atlas > 0 ? GWASByAtlas[atlas] : GWAS, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'ID' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.P) - parseFloat(a.item.P)
            })
          }
        });
        setSearchSuggestions(matches['GWAS'].map(item => item.ID).filter((value, index, self) => self.indexOf(value) === index));
      } else if (searchBy === 'IWAS' || (searchBy === '' && includesAndStartsWith(searchQuery, clinical_traits))) {
        // only need to search IWAS
        matches['IWAS'] = matchSorter(atlas > 0 ? IWASByAtlas[atlas] : IWAS, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.EQUAL, key: 'trait' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.Pvalue) - parseFloat(a.item.Pvalue)
            })
          }
        });
        // IWAS suggestions should be fuzzy (results are exact match)
        const iwasSuggestions = matchSorter(atlas > 0 ? IWASByAtlas[atlas] : IWAS, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'trait' }]
        }).map(item => item.trait).filter((value, index, self) => self.indexOf(value) === index)
        setSearchSuggestions(iwasSuggestions);
      } else { // presumably a gene symbol
        // only need to search gene analysis
        matches['geneAnalysis'] = matchSorter(atlas > 0 ? geneAnalysisByAtlas[atlas] : geneAnalysis, searchQuery, {
          keys: [{ threshold: matchSorter.rankings.MATCHES, key: 'GENE' }],
          sorter: rankedItems => {
            return rankedItems.sort((a, b) => {
              return parseFloat(b.item.P) - parseFloat(a.item.P)
            })
          }
        });
        setSearchSuggestions(matches['geneAnalysis'].map(item => item.GENE).filter((value, index, self) => self.indexOf(value) === index));
      }
      if (matches['GWAS'].length === 0 && matches['IWAS'].length === 0 && matches['geneAnalysis'].length === 0 && matches['geneticCorrelation'].length === 0) {
        matches['GWAS'] = atlas > 0 ? GWASByAtlas[atlas] : GWAS
      }
      setSearchResults(paginateResults(matches, 10));
    }
    setPagination({
      GWAS: 0,
      IWAS: 0,
      geneticCorrelation: 0,
      geneAnalysis: 0,
      heritabilityEstimate: 0,
    })
  }, [searchQuery, searchBy, atlas]);

  useEffect(() => {
    if (params.atlas !== undefined) {
      animateIn(params.atlas);
      setPhenotype('');
      setSearched(true);
    } else if (params.IDP !== undefined) {
      setSearchBy('IDP')
      submitSearch(params.IDP)
    } else if (params.query !== undefined) {
      setSearchBy('');
      submitSearch(params.query)
    } else if (params.SNP !== undefined) {
      setSearchBy('SNP')
      submitSearch(params.SNP)
    } else if (params.IWAS !== undefined) {
      setSearchBy('IWAS')
      submitSearch(params.IWAS)
    } else if (params.geneAnalysis !== undefined) {
      setSearchBy('geneAnalysis')
      submitSearch(params.geneAnalysis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);


  return (
    <div className="min-h-full">

      {/* 15rem = height of footer */}
      <div className="grid main-container grid-cols-12 auto-rows-max gap-1 px-24 mb-4" style={!searched ? { minHeight: 'calc(100% - 15rem)' } : { minHeight: '100%' }}>
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
          <img onAnimationEnd={e => e.animationName === 'bounceOutLeft' ? e.target.classList.add('hidden') : e.target.classList.remove('hidden')} className={(phenotype.length > 0 && chartType === 'manhattan' ? 'animate__animated animate__bounceInLeft' : 'animate__animated animate__bounceOutLeft') + ' w-full absolute'} src={`data/Plot/C${atlas}/${phenotype}_manhattan_plot.png`} alt={phenotype} />
          <img onAnimationEnd={e => e.animationName === 'bounceOutLeft' ? e.target.classList.add('hidden') : e.target.classList.remove('hidden')} className={(phenotype.length > 0 && chartType === 'qq' ? 'animate__animated animate__bounceInLeft' : 'animate__animated animate__bounceOutLeft') + ' max-w-xl max-h-full absolute'} src={`data/Plot/C${atlas}/${phenotype}_QQ_plot.png`} alt={phenotype} style={{ left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto' }} />
        </div>
        <div className={atlas > 0 ? (phenotype.length === 0 ? "col-span-12 -z-50 w-100 overflow-hidden" : "col-span-4") : "hidden"} style={{ maxHeight: '70vh', minHeight: '630px' }}>
          <div style={phenotype.length === 0 ? { bottom: 'calc(30vw - 100px)' } : {}} className="-z-40 h-full relative">
            <div className={atlas > 0 && phenotype.length === 0 ? "-z-30 animate__animated animate__bounceInDown" : "max-w-lg -z-30 animate__animated animate__bounceInLeft"} ref={vtkContainerRef} />
          </div>
        </div>
        {Object.keys(vtkPreviews).map((c => {
          return (
            <div className={atlas > 0 ? "hidden" : "col-span-12 sm:col-span-2"} ref={vtkPreviews[c]} key={c}>
              <img src={`data/static/gifs/C${c}.gif`} className="w-full animate__animated animate__bounceInDown" alt={"C" + c} />
              <Link to={"/C/" + c} className="btn btn-primary btn-block btn-sm">3D View C{c}</Link>
            </div>
          )
        }))}
        <p className={phenotype.length > 0 ? "col-span-12 text-right" : "hidden"}><button className="btn btn-link btn-sm" onClick={() => {
          const actors = window.renderWindow.getRenderers()[0].getActors();
          for (let i = 0; i < actors.length; i++) {
            const disabled = actors[i];
            disabled.getProperty().setOpacity(1);
            const h1 = parseInt(md5(`C${atlas}_${i}_r`), 16) / max_hash;
            const h2 = parseInt(md5(`C${atlas}_${i}_g`), 16) / max_hash;
            const h3 = parseInt(md5(`C${atlas}_${i}_b`), 16) / max_hash;
            disabled.getProperty().setColor(h1, h2, h3);
          }
          setPhenotype('');
          window.render();
          window.genericRenderer.resize();
        }}>Reset selection</button>.</p>
        <form className="col-span-12" onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          if (typingTimer !== null) {
            clearTimeout(typingTimer);
          }
          setTypingTimer(null);
          const searchBox = e.target.querySelector('input');
          navigate(`/${searchBy === '' ? 'search' : searchBy}/${searchBox.value}`);
        }}>
          <div className="form-control my-2">
            <div className="relative">
              <button type="button" className={(searched ? "" : "hidden") + " absolute top-0 left-0 rounded-r-none btn btn-primary w-28"} onClick={(e) => {
                e.preventDefault();
                navigate('/');
                animateOut();
              }}>&larr; Back</button>
              <select className={"select select-bordered select-primary rounded-r-none absolute top-0 " + (searched ? "left-24" : "left-0")} onChange={x => setSearchBy(x.target.value)}>
                <option value="">Search by</option>
                <option value="IDP">IDP</option>
                <option value="SNP">SNP</option>
                <option value="geneAnalysis">Gene symbol</option>
                <option value="IWAS">Clinical traits</option>
              </select>

              <input type="text" placeholder={fancyPlaceholder(searchBy)} className={(searched ? "pl-64" : "pl-40") + " input input-bordered input-primary w-full"} ref={searchBoxRef} onChange={x => {
                // wait to see if the user has stopped typing
                if (typingTimer !== null) {
                  clearTimeout(typingTimer);
                }
                const timeout = setTimeout(() => {
                  setSearchQuery(x.target.value);
                  setTypingTimer(null);
                  setSearched(false);
                }, 900);
                setTypingTimer(timeout);
              }} />
              <button type="submit" className="absolute top-0 right-0 rounded-l-none btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
              <ul tabIndex="0" className={searchSuggestions.length > 0 && searchQuery.length > 0 && !searched ? 'p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-full max-h-96 overflow-y-scroll' : 'hidden'}>
                {searchSuggestions.map((x, i) => {
                  return (
                    <li key={i} className="hover:bg-primary-100 z-50">
                      <button onClick={(e) => {
                        e.preventDefault();
                        searchBoxRef.current.value = x;
                        navigate(`/${searchBy === '' ? 'search' : searchBy}/${x}`);
                      }
                      } className="btn btn-ghost text-left inline w-fit normal-case font-medium">{x}</button>
                    </li>
                  );
                })}

              </ul>
            </div>
          </div>
        </form>

        {Object.keys(pagination).map(table => (
          <div className={searched && searchResults[table][0] !== undefined && searchResults[table][0].length > 0 ? "overflow-x-auto overflow-y-hidden max-h-96 col-span-" + (((searchResults['GWAS'][0] !== undefined && searchResults['GWAS'][0].length > 0) + (searchResults['IWAS'][0] !== undefined && searchResults['IWAS'][0].length > 0) + (searchResults['geneAnalysis'][0] !== undefined && searchResults['geneAnalysis'][0].length > 0) + (searchResults['geneticCorrelation'][0] !== undefined && searchResults['geneticCorrelation'][0].length > 0)) > 2 ? '6' : '12') : "hidden"}>
            <h4 className="font-bold text-xl inline">{table === 'geneAnalysis' ? 'Gene analysis' : table === 'heritabilityEstimate' ? 'Heritability estimate' : table === 'geneticCorrelation' ? 'Genetic correlation' : table}</h4>
            <div className="badge badge-primary badge-sm ml-2 relative bottom-1">{searchResults[table].flat(Infinity).length} results</div>
            <div className="inline btn-group float-right">
              <button className={"btn btn-xs" + (pagination[table] === 0 ? ' btn-disabled' : '')} onClick={(e) => {
                switch (table) {
                  case 'GWAS':
                    setPagination({
                      GWAS: pagination.GWAS - 1,
                      IWAS: pagination.IWAS,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'IWAS':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS - 1,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneticCorrelation':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      geneticCorrelation: pagination.geneticCorrelation - 1,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneAnalysis':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis - 1,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'heritabilityEstimate':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
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
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'IWAS':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: x + pagination.IWAS - Math.min(pagination.IWAS, 2),
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'geneticCorrelation':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
                        geneticCorrelation: x + pagination.geneticCorrelation - Math.min(pagination.geneticCorrelation, 2),
                        geneAnalysis: pagination.geneAnalysis,
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'geneAnalysis':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
                        geneticCorrelation: pagination.geneticCorrelation,
                        geneAnalysis: x + pagination.geneAnalysis - Math.min(pagination.geneAnalysis, 2),
                        heritabilityEstimate: pagination.heritabilityEstimate,
                      });
                      break;
                    case 'heritabilityEstimate':
                      setPagination({
                        GWAS: pagination.GWAS,
                        IWAS: pagination.IWAS,
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
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'IWAS':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS + 1,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneticCorrelation':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      geneticCorrelation: pagination.geneticCorrelation + 1,
                      geneAnalysis: pagination.geneAnalysis,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'geneAnalysis':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
                      geneticCorrelation: pagination.geneticCorrelation,
                      geneAnalysis: pagination.geneAnalysis + 1,
                      heritabilityEstimate: pagination.heritabilityEstimate,
                    });
                    break;
                  case 'heritabilityEstimate':
                    setPagination({
                      GWAS: pagination.GWAS,
                      IWAS: pagination.IWAS,
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
                        <tr key={i} className="hover cursor-pointer">
                          <td>{x.IDP}</td><td>{x.ID}</td><td>{x.P}</td><td>{x.BETA}</td>
                        </tr>
                      );
                    case 'IWAS':
                      return (
                        <tr key={i} className="hover cursor-pointer">
                          <td>{x.IDP}</td><td>{x.trait}</td><td>{x.Pvalue}</td><td>{x.ES}</td>
                        </tr>
                      );
                    case 'geneticCorrelation':
                      return (
                        <tr key={i} className="hover cursor-pointer">
                          <td>{x.IDP}</td><td>{x.trait}</td><td>{x.gc_mean}</td><td>{x.gc_std}</td><td>{x.P}</td>
                        </tr>
                      );
                    case 'geneAnalysis':
                      return (
                        <tr key={i} className="hover cursor-pointer">
                          <td>{x.IDP}</td><td>{x.GENE}</td><td>{x.CHR}</td><td>{x.START} - {x.STOP}</td><td>{x.NSNPS}</td><td>{x.NPARAM}</td><td>{x.N}</td><td>{x.ZSTAT}</td><td>{x.P}</td>
                        </tr>
                      );
                    case 'heritabilityEstimate':
                      return (
                        <tr key={i} className="hover cursor-pointer">
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