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
                                    <img src={process.env.PUBLIC_URL + "/data/png/C256/C256_rot-1.png"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title">Junhao Wen</h2>
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
                                    <img src={process.env.PUBLIC_URL + "/data/png/C256/C256_rot-1.png"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title">Timothy Robert-Fitzgerald</h2>
                                <p className="text-base-content text-opacity-40">Developer and maintainer</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <div className="card shadow-lg compact side bg-base-100">
                        <div className="flex-row items-center space-x-4 card-body"><div>
                            <div className="avatar">
                                <div className="rounded-full w-14 h-14 shadow">
                                    <img src={process.env.PUBLIC_URL + "/data/png/C256/C256_rot-1.png"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title">Mark Bergman</h2>
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
                                    <img src={process.env.PUBLIC_URL + "/data/png/C256/C256_rot-1.png"} alt="" />
                                </div>
                            </div>
                        </div>
                            <div>
                                <h2 className="card-title">Christos Davatzikos</h2>
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