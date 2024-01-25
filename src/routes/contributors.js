import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
export default function Contributors() {
    return (
        <div className="min-h-full">
            <div className="grid main-container grid-cols-12 auto-rows-max gap-6 px-24 mb-8" style={{ minHeight: 'calc(100% - 15rem)' }}>
                <div className="col-span-12 py-4 mb-2">
                    <NavBar />
                </div>
                <div className="col-span-12 mb-4">
                    <h2 className="text-5xl border-primary border-b-4 inline-block text-base-content font-bold">Contributors</h2>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <div className="card shadow-lg compact side bg-base-100">
                        <div className="flex-row items-center space-x-4 card-body"><div>
                            <div className="avatar">
                                <div className="rounded-full w-14 h-14 shadow">
                                    <img src={process.env.PUBLIC_URL + "/data/png/hao.jpg"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title"><a href="https://www.junhaowen.com/#about">Junhao (Hao) Wen</a></h2>
                                <p className="text-base-content text-opacity-40">Co-founder and coordinator</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <div className="card shadow-lg compact side bg-base-100">
                        <div className="flex-row items-center space-x-4 card-body"><div>
                            <div className="avatar">
                                <div className="rounded-full w-14 h-14 shadow">
                                    <img src={process.env.PUBLIC_URL + "/data/png/tim.jpg"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title"><a href="https://www.cs.oberlin.edu/~trobertf/">Timothy Robert-Fitzgerald</a></h2>
                                <p className="text-base-content text-opacity-40">Developer</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <div className="card shadow-lg compact side bg-base-100">
                        <div className="flex-row items-center space-x-4 card-body"><div>
                            <div className="avatar">
                                <div className="rounded-full w-14 h-14 shadow">
                                    <img src={process.env.PUBLIC_URL + "/data/png/mark.png"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title"><a href="https://www.med.upenn.edu/sbia/mbergman.html">Mark Bergman</a></h2>
                                <p className="text-base-content text-opacity-40">Maintainer</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <div className="card shadow-lg compact side bg-base-100">
                        <div className="flex-row items-center space-x-4 card-body"><div>
                            <div className="avatar">
                                <div className="rounded-full w-14 h-14 shadow">
                                    <img src={process.env.PUBLIC_URL + "/data/png/alex.png"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title"><a href="https://aibil.med.upenn.edu/people/alex-getka/">Alexander Getka</a></h2>
                                <p className="text-base-content text-opacity-40">Maintainer</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <div className="card shadow-lg compact side bg-base-100">
                        <div className="flex-row items-center space-x-4 card-body"><div>
                            <div className="avatar">
                                <div className="rounded-full w-14 h-14 shadow">
                                    <img src={process.env.PUBLIC_URL + "/data/png/christos.jpg"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title"><a href="https://www.med.upenn.edu/apps/faculty/index.php/g275/p32990">Christos Davatzikos</a></h2>
                                <p className="text-base-content text-opacity-40">Co-founder</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}