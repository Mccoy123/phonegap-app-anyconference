var fs   = require("fs"),
    jade = require("jade"),
    path = require("path")

module.exports = function (grunt) {

    var TELEMETRY_DIR = 'test/perf/telemetry/perf/page_sets/',
        MASTER_JADE   = 'topcoat_telemetry.jade';

    grunt.registerTask('perf', 'Generates performance test', function (platform, theme) {

        var perfJades = findAllPerfJadeFileInSrc();

        var targetPlatform = platform || 'mobile',
            targetTheme    = theme    || 'light',
            targetCSS      = 'default';

        var jadeCompileData = {};

        grunt.util._.forEach(perfJades, function (jadePath) {

            var jadeFileName = path.basename(jadePath).split('.')[0];

            targetCSS = prepareCSS(jadeFileName);

            prepareJadeCompileData(jadeCompileData, jadePath,
                jadeFileName, targetPlatform, targetTheme, targetCSS);

            createTelemetryJSON(jadeFileName);
        });
        batchCompileJade(jadeCompileData);
    });

    var findAllPerfJadeFileInSrc = function () {

        var jades = grunt.file.expand('src/**/test/**/topcoat_*.test.jade');

        if (jades.length == 0){
            throw new Error("ERROR: No jade file is found in src/../test/perf/");
        }

        return jades;
    }

    var prepareCSS = function(caseName) {

        var isBaseControl = caseName.indexOf('base') != -1 ? true : false;
        var css = 'default';

        if (isBaseControl) {
            var name = caseName.split('_')[1].slice(0, -5);
            css = 'releaseBase/' + name + '.css'
        }

        return css;
    }

    var prepareJadeCompileData = function (jadeCompileData, jadePath,
                                           caseName, platform, theme, css) {

        var jadeContent = fs.readFileSync(jadePath, "utf8"),
            getHtml = jade.compile(jadeContent, {pretty: true});

        jadeCompileData[caseName] = {
            options: {
                data: {
                    platform: platform,
                    theme: theme,
                    css: css,
                    name: caseName,
                    componentHTML: getHtml()
                }
            },
            src:  TELEMETRY_DIR + "topcoat/" + MASTER_JADE,
            dest: TELEMETRY_DIR + "topcoat/" + caseName + ".test.html"
        }
    }

    var createTelemetryJSON = function (caseName) {

        var jsonContent = {
            "description": "Test",
            "archive_data_file": "../data/topcoat_buttons.json",
            "pages": [
                {
                    "url": "file:///topcoat/" + caseName + ".test.html",
                    "smoothness": {
                        "action": "scrolling_action"
                    }
                }
            ]
        }

        var jsonFilePATH = TELEMETRY_DIR + caseName + '.test.json';

        fs.writeFileSync(
            jsonFilePATH,
            JSON.stringify(jsonContent, null, 4),
            'utf8')

        console.log("File " + jsonFilePATH + " created.")
    }

    var batchCompileJade = function(data){
        grunt.config('jade', data);
        grunt.task.run('jade');
    }
}