import { Link, useLocation } from "react-router-dom";
const NavBar = () => {
    const location = useLocation();
    return (
        <div>
            <ul className="horizontal sm-menu menu items-stretch px-3 shadow-lg bg-base-100 rounded-box max-w-full sm:float-right overflow-visible">
                <li className={["/publications", "/contributors"].includes(location.pathname) ? "" : "bordered"}>
                    <Link to="/">
                        BRIDGEPORT
                    </Link>
                </li>
                <li>
                    <div className="dropdown dropdown-end">
                        <button className="btn btn-link text-base text-base-content hover:bg-gray-200 hover:no-underline font-normal normal-case rounded-0" style={{height:'100%', borderRadius:"0px"}} tabIndex="0">Download GWAS</button>
                        <ul tabIndex="0" className="p-0 shadow menu dropdown-content bg-base-100 rounded-box w-52">
                            {[32, 64, 128, 256, 512, 1024].map(i => (
                                <li key={i}>
                                    <button onClick={() => document.getElementById('download').classList.toggle('modal-open')}>Download C{i}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </li>
                <li>
                    <div className="dropdown dropdown-end">
                        <button className="btn btn-link text-base text-base-content hover:bg-gray-200 h-100 hover:no-underline font-normal normal-case rounded-0" style={{height:'100%', borderRadius:"0px"}} tabIndex="0">Download MINA</button>
                        <ul tabIndex="0" className="p-0 shadow menu dropdown-content bg-base-100 rounded-box w-52">
                            {[32, 64, 128, 256, 512, 1024].map(i => (
                                <li key={i}>
                                    <button onClick={() => document.getElementById('download').classList.toggle('modal-open')}>Download C{i}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </li>
                <li className={location.pathname === '/publications' ? "bordered" : ""}>
                    <Link to="/publications">Publications</Link>
                </li>
                <li className={location.pathname === '/contributors' ? "bordered" : ""}>
                    <Link to="/contributors">Contributors</Link>
                </li>
                <li>
                    <a href="https://www.med.upenn.edu/cbica/">
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
                        <p>GWAS and MINA full results will be available in March.</p>
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