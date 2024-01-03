import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
export default function Publications() {
    return (
        <div className="min-h-full">
            <div className="grid main-container grid-cols-12 auto-rows-max gap-1 px-24 mb-8" style={{ minHeight: 'calc(100% - 15rem)' }}>
                <div className="col-span-12 py-4 mb-4">
                    <NavBar />
                </div>
                <div className="col-span-full md:col-span-4">
                    <h2 className="text-5xl border-primary border-b-4 inline-block text-base-content font-bold">Publications</h2>
                </div>
                <div className="col-span-full md:col-span-8">
                    <h3 className="text-2xl font-semibold">Genomic loci influence patterns of structural covariance in the human brain</h3>
                    <h4 className="text-primary">Wen, J., Nasrallah, I.M., Abdulkadir, A., Satterthwaite, T.D., Yang, Z., Erus, G., Robert-Fitzgerald, T., Singh, A., Sotiras, A., Boquet-Pujadas, A. and Mamourian, E.,</h4>
                    <h5>In <i>PNAS</i>, 2023.</h5>
                    <div className="btn-group mt-1">
                        <a target="_blank" rel="noreferrer" href="https://www.pnas.org/doi/10.1073/pnas.2300842120" className="btn btn-primary btn-outline btn-sm">Link</a>
                        {/* <button onClick={() => document.getElementById('download').classList.toggle('modal-open')} className="btn btn-primary btn-outline btn-sm">Download GWAS</button> */}
                    </div>
                    {/* <img alt="" src={process.env.PUBLIC_URL + "/thumbnail_Fig_JAMA_Psy.png"} className="w-100" /> */}

                </div>
            </div>
            <Footer />
        </div>
    )
}