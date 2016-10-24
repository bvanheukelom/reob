# Get to the Travis build directory, configure git and clone the repo
cd $TMPDIR
rm -rf reob
mkdir reob
cd reob
git clone git@github.com:bvanheukelom/reob.git
cd reob
npm install
npm run doc
mv doc ..
git checkout gh-pages
cp CNAME ../doc
rm -rf node_modules
git rm -rf *
cp -r ../doc/* .
git add -f .
git commit -m "Lastest typedoc auto-pushed to gh-pages"
git push -fq origin gh-pages
cd ../..
rm -rf reob