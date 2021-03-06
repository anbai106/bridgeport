import { Link, useLocation } from "react-router-dom";
const NavBar = () => {
    const location = useLocation();
    return (
        <div>
            <ul className="horizontal sm-menu menu items-stretch px-3 shadow-lg bg-base-100 rounded-box w-full sm:w-auto sm:float-right overflow-visible">
                <li className={["/publications", "/contributors"].includes(location.pathname) ? "" : "bordered"}>
                    <Link to="/" className="sm:w-auto w-full">
                        BRIDGEPORT
                    </Link>
                </li>
                <li>
                    <div className="dropdown dropdown-end">
                        <button className="btn btn-link text-base text-base-content hover:bg-gray-200 hover:no-underline font-normal normal-case rounded-0" style={{ height: '100%', borderRadius: "0px" }} tabIndex="0">Download GWAS</button>
                        <ul tabIndex="0" className="p-0 shadow menu dropdown-content bg-base-100 rounded-box w-max" style={{ padding: 0 }}>
                            {[32, 64, 128, 256, 512, 1024].map(i => (
                                <li key={i} className="p-0 m-0 w-full">
                                    <button className="w-full" onClick={() => document.getElementById('download').classList.toggle('modal-open')}>Download C{i}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </li>
                <li>
                    <div className="dropdown dropdown-end">
                        <button className="btn btn-link text-base text-base-content hover:bg-gray-200 h-100 hover:no-underline font-normal normal-case rounded-0" style={{ height: '100%', borderRadius: "0px" }} tabIndex="0">Download MuSIC</button>
                        <ul tabIndex="0" className="p-0 shadow menu dropdown-content bg-base-100 rounded-box w-max" style={{ padding: 0 }}>
                            {[32, 64, 128, 256, 512, 1024].map(i => (
                                <li key={i} className="p-0 m-0 w-full">
                                    <button className="w-full" onClick={() => document.getElementById('download').classList.toggle('modal-open')}>Download C{i}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </li>
                <li className={location.pathname === '/publications' ? "bordered" : ""}>
                    <Link to="/publications" className="sm:w-auto w-full">Publications</Link>
                </li>
                <li className={location.pathname === '/contributors' ? "bordered" : ""}>
                    <Link to="/contributors" className="sm:w-auto w-full">Contributors</Link>
                </li>
                <li>
                    <div className="dropdown dropdown-end">
                        <button className="btn btn-link text-base text-base-content hover:bg-gray-200 h-100 hover:no-underline font-normal normal-case rounded-0" style={{ height: '100%', borderRadius: "0px" }} tabIndex="0">Software</button>
                        <ul tabIndex="0" className="p-0 shadow menu dropdown-content bg-base-100 rounded-box w-max" style={{ padding: 0 }}>
                            <li className="px-4">
                                <a href="https://pypi.org/project/sopnmf/" className="w-full">sopNMF</a>
                            </li>
                            <li className="px-4">
                                <a href="data/pdf/BIGS_genetic_protocol.pdf" className="w-full">BIGS genetic protocol</a>
                            </li>
                            <li className="px-4">
                                <a href="https://www.med.upenn.edu/sbia/muse.html" className="w-full">MUSE</a>
                            </li>
                            <li className="px-4">
                                <a href="https://pypi.org/project/mlni/" className="w-full">MLNI</a>
                            </li>
                            <li className="px-4">
                                <a href="http://www.clinica.run/" className="w-full">Clinica</a>
                            </li>
                        </ul>
                    </div>
                </li>
                <li>
                    <a href="https://www.med.upenn.edu/cbica/" className="sm:w-auto w-full">
                        CBICA
                    </a>
                </li>
            </ul>
            <div id="download" className="modal">
                <div className="modal-box">
                    <div className="flex flex-col w-full">
                        {/* <p className="mb-2">Download through your browser:</p>
                        <p><a href="/#" className="btn btn-primary btn-block">Download</a></p>
                        <div className="divider">OR</div>
                        <p className="mb-2">Download through the command line:</p>
                        <div className="mockup-code">
                            <pre data-prefix="$">
                                <code>curl http://localhost</code>
                            </pre>
                        </div> */}
                        <p>GWAS and MuSIC full results will be available in March.</p>
                    </div>
                    <div className="modal-action">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <button onClick={() => document.getElementById('download').classList.toggle('modal-open')} className="btn">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default NavBar;