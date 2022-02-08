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
                    <h3 className="text-2xl font-semibold">Multidimensional representations in late-life depression: convergence in neuroimaging, cognition, clinical symptomatology and genetics</h3>
                    <h4 className="text-primary">Junhao Wen, Cynthia H.Y. Fu, Duygu Tosun, Yogasudha Veturi, Zhijian Yang, Ahmed Abdulkadir, Elizabeth Mamourian, Dhivya Srinivasan, Jingxuan Bao, Guray Erus, Haochang Shou, Mohamad Habes, Jimit Doshi, Erdem Varol, Scott R Mackin, Aristeidis Sotiras, Yong Fan, Andrew J. Saykin, Yvette I. Sheline, Li Shen, Marylyn D. Ritchie, David A. Wolk, Marilyn Albert, Susan M. Resnick, Christos Davatzikos</h4>
                    <h5>In <i>JAMA Psychiatry</i>, 2022.</h5>
                    <div class="btn-group mb-6 mt-1">
                        <a target="_blank" rel="noreferrer" href="https://arxiv.org/abs/2110.11347" class="btn btn-primary btn-outline btn-sm">Link</a>
                    </div>
                    <h3 className="text-2xl font-semibold">Convolutional Neural Networks for Classification of Alzheimer's Disease: Overview and Reproducible Evaluation</h3>
                    <h4 className="text-primary">Junhao Wen, Elina Thibeau-Sutre, Mauricio Diaz-Melo, Jorge Samper-González, Alexandre Routier, Simona Bottani, Didier Dormont, Stanley Durrleman, Ninon Burgos, Olivier Colliot</h4>
                    <h5>In <i>Medical Image Analysis</i>, 2020.</h5>
                    <div class="btn-group mb-6 mt-1">
                        <a target="_blank" rel="noreferrer" href="https://anbai106.github.io/publication/cnn-t1/" class="btn btn-primary btn-outline btn-sm">Details</a>
                        <a target="_blank" rel="noreferrer" href="https://github.com/aramis-lab/AD-DL" class="btn btn-primary btn-outline btn-sm">Code</a>
                        <a target="_blank" rel="noreferrer" href="https://www.sciencedirect.com/science/article/pii/S1361841520300591" class="btn btn-primary btn-outline btn-sm">Link</a>
                    </div>

                    <h3 className="text-2xl font-semibold">Early Cognitive, Structural, and Microstructural Changes in Presymptomatic C9orf72 Carriers Younger Than 40 Years</h3>
                    <h4 className="text-primary">Anne Bertrand, Junhao Wen (co-first author), Daisy Rinaldi, Marion Houot, Sabrina Sayah, Agnès Camuzat, Clémence Fournier, Sabrina Fontanella, Alexandre Routier, Philippe Couratier, Florence Pasquier, Marie-Odile Habert, Didier Hannequin, Olivier Martinaud, Paola Caroppo, Richard Levy, Bruno Dubois, Alexis Brice, Stanley Durrleman, Olivier Colliot, Isabelle Le Ber</h4>
                    <h5>In <i>JAMA neurology</i>, 2020.</h5>
                    <div class="btn-group mb-6 mt-1">
                        <a target="_blank" rel="noreferrer" href="https://anbai106.github.io/publication/prevdemals-t1dti/" class="btn btn-primary btn-outline btn-sm">Details</a>
                        <a target="_blank" rel="noreferrer" href="https://anbai106.github.io/pdf/prevdemals_ppt.pdf" class="btn btn-primary btn-outline btn-sm">Slides</a>
                        <a target="_blank" rel="noreferrer" href="https://anbai106.github.io/pdf/prevdemals_T1_dti_poster.pdf" class="btn btn-primary btn-outline btn-sm">Poster</a>
                        <a target="_blank" rel="noreferrer" href="https://jamanetwork.com/journals/jamaneurology/article-abstract/2665213" class="btn btn-primary btn-outline btn-sm">Link</a>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    )
}