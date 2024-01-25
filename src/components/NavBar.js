import { Link, useLocation } from "react-router-dom";
import { listFilesInBucket, downloadSet, downloadMusicParcel } from "../utils/downloadData";
import { useState } from "react";
import Loader from "./Loader"



const NavBar = () => {
    const location = useLocation();

    const [userEmail, setUserEmail] = useState("");
    const [promptedForEmail, setPromptedForEmail] = useState(false);

    const [isC32Downloading, setisC32Downloading] = useState(false);
    const [isC64Downloading, setisC64Downloading] = useState(false);
    const [isC128Downloading, setisC128Downloading] = useState(false);
    const [isC256Downloading, setisC256Downloading] = useState(false);
    const [isC512Downloading, setisC512Downloading] = useState(false);
    const [isC1024Downloading, setisC1024Downloading] = useState(false);

    const [C32TotalFiles, setC32TotalFiles] = useState(0);
    const [C64TotalFiles, setC64TotalFiles] = useState(0);
    const [C128TotalFiles, setC128TotalFiles] = useState(0);
    const [C256TotalFiles, setC256TotalFiles] = useState(0);
    const [C512TotalFiles, setC512TotalFiles] = useState(0);
    const [C1024TotalFiles, setC1024TotalFiles] = useState(0);

    const [C32CurrentFile, setC32CurrentFile] = useState(0);
    const [C64CurrentFile, setC64CurrentFile] = useState(0);
    const [C128CurrentFile, setC128CurrentFile] = useState(0);
    const [C256CurrentFile, setC256CurrentFile] = useState(0);
    const [C512CurrentFile, setC512CurrentFile] = useState(0);
    const [C1024CurrentFile, setC1024CurrentFile] = useState(0);

    const incrementC32Current = () => {
        setC32CurrentFile(C32CurrentFile + 1);
    }

    const incrementC64Current = () => {
        setC64CurrentFile(C64CurrentFile + 1);
    }

    const incrementC128Current = () => {
        setC128CurrentFile(C128CurrentFile + 1);
    }

    const incrementC256Current = () => {
        setC256CurrentFile(C256CurrentFile + 1);
    }

    const incrementC512Current = () => {
        setC512CurrentFile(C512CurrentFile + 1);
    }

    const incrementC1024Current = () => {
        setC1024CurrentFile(C1024CurrentFile + 1);
    }

    const createPromise = () => {
        let resolver;
        return [ new Promise((resolve, reject) => {
            resolver = resolve;
        }), resolver]
    }

    const promptUserForEmail = async  () => {
        if (!promptedForEmail) {
            const res = prompt("Would you like to provide your email address to us? This is completely optional, is solely used to help us determine how widely our data is being used and will not be shared with anyone for any reason. To decline, just leave this field empty. You will not be asked again unless you refresh the page.")
            if (res) {
                setUserEmail(res);
            }
            setPromptedForEmail(true);
        }
       else {
        return;
       }
    }

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
                        <button onClick={() => document.getElementById('download').classList.toggle('modal-open')} className="btn btn-link text-base text-base-content hover:bg-gray-200 hover:no-underline font-normal normal-case rounded-0" style={{ height: '100%', borderRadius: "0px" }} tabIndex="0">Download GWAS</button>
                        <ul  tabIndex="0" className="p-0 shadow menu dropdown-content bg-base-100 rounded-box w-max" style={{ padding: 0 }}>
                            {[32, 64, 128, 256, 512, 1024].map(i => (
                                <li key={i} className="p-0 m-0 w-full">
                                    {/*<button className="w-full" onClick={() => document.getElementById('download').classList.toggle('modal-open')}>Download C{i}</button>*/}
                                    {/*<button className="w-full" onClick={async () => await listFilesInBucket()}>(PLACEHOLDER/LIST) Download C{i}</button>*/}
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
                                    {/*<button className="w-full" onClick={() => document.getElementById('download').classList.toggle('modal-open')}>Download C{i}</button>*/}
                                    {<button className="w-full" onClick={async () => {await promptUserForEmail(); await downloadMusicParcel("C" + i.toString(), userEmail)} }>Download C{i}</button>}
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
                            {/* <li className="px-4">
                                <a href="data/pdf/BIGS_genetic_protocol.pdf" className="w-full">BIGS genetic protocol</a>
                            </li> */}
                            <li className="px-4">
                                <a href="https://www.med.upenn.edu/sbia/muse.html" className="w-full">MUSE</a>
                            </li>
                            <li className="px-4">
                                <a href="https://pypi.org/project/mlni/" className="w-full">MLNI</a>
                            </li>
                            {/* <li className="px-4">
                                <a href="http://www.clinica.run/" className="w-full">Clinica</a>
                            </li> */}
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
                        <p className="mb-2">For best performance and control of these large downloads we <b>strongly recommend</b> downloading via the CLI. To download data for a specific PSC, navigate to it using the search bar and click the Download button.</p>
                        <p className="mb-2">Download the datasets through your browser (this will take a while):</p>
                        <p><a onClick={async () => { await promptUserForEmail(); setisC32Downloading(true); await downloadSet("C32_", setC32TotalFiles, setC32CurrentFile); setisC32Downloading(false)}} className="btn btn-primary btn-block">{isC32Downloading? "Downloading, please wait...": "Download C32 GWAS"}</a></p>
                        <p hidden={!isC32Downloading}>Downloading... (File {C32CurrentFile}/{C32TotalFiles})</p>
                        <p><a onClick={async () => { await promptUserForEmail(); setisC64Downloading(true); await downloadSet("C64_", setC64TotalFiles, setC64CurrentFile); setisC64Downloading(false)}} className="btn btn-primary btn-block"> {isC64Downloading? "Downloading, please wait...": "Download C64 GWAS"}</a></p>
                        <p hidden={!isC64Downloading}>Downloading... (File {C64CurrentFile}/{C64TotalFiles})</p>
                        <p><a onClick={async () => { await promptUserForEmail(); setisC128Downloading(true); await downloadSet("C128_", setC128TotalFiles, setC128CurrentFile); setisC128Downloading(false)}} className={"btn btn-primary btn-block "}>{isC128Downloading? "Downloading, please wait...": "Download C128 GWAS"}</a></p>
                        <p hidden={!isC128Downloading}>Downloading... (File {C128CurrentFile}/{C128TotalFiles})</p>
                        <p><a onClick={async () => { await promptUserForEmail(); setisC256Downloading(true); await downloadSet("C256_", setC256TotalFiles, setC256CurrentFile); setisC256Downloading(false)}} className={"btn btn-primary btn-block "}>{isC256Downloading? "Downloading, please wait...": "Download C256 GWAS"}</a></p>
                        <p hidden={!isC256Downloading}>Downloading... (File {C256CurrentFile}/{C256TotalFiles})</p>
                        <p><a onClick={async () => { await promptUserForEmail(); setisC512Downloading(true); await downloadSet("C512_", setC512TotalFiles, setC512CurrentFile); setisC512Downloading(false)}} className={"btn btn-primary btn-block "}>{isC512Downloading? "Downloading, please wait...": "Download C512 GWAS"}</a></p>
                        <p hidden={!isC512Downloading}>Downloading... (File {C512CurrentFile}/{C512TotalFiles})</p>
                        <p><a onClick={async () => { await promptUserForEmail(); setisC1024Downloading(true); await downloadSet("C1024_", setC1024TotalFiles, setC1024CurrentFile); setisC1024Downloading(false)}} className={"btn btn-primary btn-block "}>{isC1024Downloading? "Downloading, please wait...": "Download C1024 GWAS"}</a></p>
                        <p hidden={!isC1024Downloading}>Downloading... (File {C32CurrentFile}/{C1024TotalFiles})</p>
                        <div className="divider">OR</div>
                        <p className="mb-2">Download through the command line via the <a style={{color: "blue"}} href="https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" target="_blank" rel="noopener noreferrer">AWS CLI tool</a>:</p>
                        <p>For example, to download C1024:</p>
                        <div className="mockup-code">
                            <pre data-prefix="$">
                                <code>aws s3 cp --region us-east-1 s3://aws-cbica-bridgeport-gwas/C1024 [local_destination] --recursive</code>
                            </pre>
                        </div>
                        {/*<p>GWAS and MuSIC full results will be available in March.</p>*/}
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