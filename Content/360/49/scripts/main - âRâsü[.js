/**
* 実行元となるメインのスクリプト(not Class)
*
* @class main.js
*/
(function () {

        var configView,
            configCore,
            selectedGradeItem,
            selectedGradeRelation,
            gradeList,
            selectedGradeCombination;

        var selectedClsName = "selected";           // Items選択状態のCSSクラス名
        var selectNoticeClsName = "selectNotice";   // 自動変更対象のCSSクラス名
        // var firstMode = "EXTERIOR";                 // 初期表示時のモード
        var NOT_SELECTED_ID_STR = "_I";

        // インテリアテスト用仮変数
        var configIntView;
        // Featureポイント
        var fpView;
		
		var intSwfIntervalId;
		
		// PC or SmartDevice
		//var isSD = RegExp('iphone|ipod|ipad|android|BlackBerry|Windows Phone', 'i').test(navigator.userAgent);
		var isSD = true;

        // -------------------------------------------------
        //  初期化
        // -------------------------------------------------

        /**
        *　Coreの初期化を行い、grade_listの読み込みを開始する
        *　
        * @method initialize
        */
        function initialize(){

            configCore = new ConfigCore();

            // Grade要素生成
            //[maru]グレードJSONのパスをベタ書き（臨時）
            $(configCore).bind("loadComplete",gradeListLoadHandler);
            $(configCore).bind("loadFailed",function(){});
            configCore.loadSetting("../assets/setting/grade_list.json");
        }

        /**
        *　インテリア用のViewを初期化する
        *　
        * @method initInteriorView
        */
        function initInteriorView(){
			
			if(!configIntView){
				configIntView = $("#interiorStage");
				
				if(!isSD){
					// PC
					var intStageW = $("#interiorStage").width();
					var intStageH = $("#interiorStage").height();
					$('#interiorStage').flash({swf:'../assets/image/InteriorView.swf',height:intStageH,width:intStageW,wmode:'transparent',id:'InteriorView',name:'InteriorView'});
				}else{
					// SmartDevice
				}
			}
			
			$('#loadingIndicator').stop(true).show(10).delay(2000).hide(10);
        }


        /**
        *　フィーチャーポイント用のViewを初期化する
        *　
        * @method initFpView
        */
        function initFpView(){

            var mode = $(".modeBtn" + ".selected").attr("id");
            var features,displayTargetSize;

            if (mode === "EXTERIOR"){
                features = configCore.feature_list.EXT;
                displayTargetSize = configView.getDisplayTargetSize();
            }else if (mode === "INTERIOR"){
                //features = configCore.feature_list.INT;
                //displayTargetSize = configIntView.getDisplayTargetSize();
            }

            if(!features){
                features = {};
            }

            fpView = new ConfigFeatureView({
                features : features,
                displayTargetId : "#func-point",
                angle : configView.getCurrentAngle(),
				step : configView.getAngleStep(),
                numAngleStep : configView.getNumAngleStep(),
                templateId : "#TMPL_SP_DESCRIPTION",
                parentViewSize : displayTargetSize,
                baseSize : configCore.feature_list.stage
            });


        }

        /**
        * configViewを初期化し、grade選択用のDOMを構築する。
        * 初期選択のgradeを取得し、
        * gradeにひもづくitem/relation/combinationのJSONの読み込みを開始。
        * メニュー系のイベントリスナーを追加する。
        *　
        * @method gradeListLoadHandler
        */
        var gradeListLoadHandler = function(){

            $(configCore).unbind("loadComplete");
            $(configCore).unbind("loadFailed");
            gradeList = configCore.grade_list;

            configView = new ConfigView({
                'numAngles' : 36,                // 総アングル数（＝ファイル数）
                'numAngleStep' : gradeList.angleStep,             // 回転ステップ数
                'materialDirPath' : gradeList.materialDirPath,
                'displayTarget' : "#exteriorStage",
                'loadingIndicator' : "#loadingIndicator"
                // ステージサイズ
                // 'size' : {
                //     width : 875,
                //     height : 525
                // }
            });

            configView.init();

            configView.createSelection("#GRADE_LIST div.slideAreaWrap", gradeList,"#TMPL_ITEM");
            loadGradeSetting($("#GRADE_LIST .GRD"+".selected").attr('id'));


			var $indicator = ("#indicator ul");
			var step = configView.getNumAngleStep();
			for(var i=0;i<step; i++){
				var li = '<li>'+ i +'</li>';
				$(li).appendTo($indicator);
			}
			
			
            // イベントリスナーを追加
            addGradeSelectListner();
            addModeSelectListner();
            addItemSelectListner();
            addConfigViewListner();
			
			
			// スライドメニューの初期化
			setSlideArea("#GRADE_LIST");
			
			// TODO:このタイミングでOK?
			$("#func-point").on('click', '#fp-descriptions .fp-closeBtn', function(){
				fpView.hideAllDescriptions();
			});
			
			$("#featuresSwitch .fpSwitchBtn").on('click', function(){
				if($(this).hasClass('on')){
					$(this).removeClass('on');
					$("#func-point").hide();
					fpView.hideAllDescriptions();
				}else{
					$(this).addClass('on');
					$("#func-point").show();
				}
			});
			
			$("#selectMenu .menuTab-SMR").on('click', function(){
				$("#SUMMARY .summaryBlockLeft").empty();
				$("#SUMMARY .summaryBlockRight").empty();
				addSummaryItem("#SUMMARY .summaryBlockLeft", "GRADE", "#GRADE_LIST", false);
				addSummaryItem("#SUMMARY .summaryBlockLeft", "BODY COLOUR", "#EXT_BODY_COLOR", false);
				addSummaryItem("#SUMMARY .summaryBlockLeft", "INTERIOR COLOUR", "#INT_BASE", false);
				addSummaryItem("#SUMMARY .summaryBlockRight", "WHEEL", "#EXT_WHEEL", false);
				addSummaryItem("#SUMMARY .summaryBlockRight", "OPTIONS&ACCESSORIES", "#EXT_OPTION_ACCESSORY", true);
			});
			
			$(".selectMenuWrapper").on('click', 'dd.noConfig', function() {
				$(this).find(".noSimulationTooltip").stop(true, false).show(10).animate({opacity:1},3000).hide(10);
			});
			
			$(document).on('mousedown', function(event){
				if($(event.target).parents('.subMenu').length==0){
					$('.subMenu').hide();
				}
			});

        };


        // -------------------------------------------------
        //  UI　イベントバインド
        // -------------------------------------------------

        /**
         * Grade選択時のイベントリスナー
         * 選択されたgradeにひもづくJSONファイルを読み込む
         * @method addGradeSelectListner
         */
        function addGradeSelectListner(){

//          var $gradeBtn = $("#gradeWrapper dd");
			var $gradeBtn = $("#GRADE_LIST dd");

            $gradeBtn.on('click',function(event){

                event.stopPropagation();
                event.returnValue = false;

                $gradeBtn.removeClass(selectedClsName);
                $(this).addClass(selectedClsName);

                // [TODO]
                // Gradeを再読み込みした場合はMenuのDOM要素を再利用する。
                // （仮動作のために空にしてDOMを作り直している）
                $("#EXT_BACKGROUND div.slideAreaWrap").empty();
                $("#EXT_BODY_COLOR div.slideAreaWrap").empty();
                $("#EXT_WHEEL div.slideAreaWrap").empty();
                $("#EXT_OPTION_ACCESSORY div.slideAreaWrap").empty();
                $("#INT_BASE div.slideAreaWrap").empty();

                // Grade別JSONファイルの再読み込み
                loadGradeSetting($("#GRADE_LIST .GRD"+".selected").attr('id'));

            });

        }

        /**
         * EXTERIOR/INTERIOR選択時のイベントリスナー
         * @method addModeSelectListner
         */
        function addModeSelectListner(){

            $("#modeSelect").on('click', '.modeBtn', function(){

                var modeId = $(this).attr('id');

                $("#modeSelect"+' .modeBtn').removeClass(selectedClsName);
                $(this).addClass(selectedClsName);
				
				
				$('#selectMenu ul.menuTab li').removeClass('tabOn');
				$('#selectMenu .selectMenuWrapper>div').hide();
				

                // [TODO]
                // EXTERIOR/INTERIOR切替時はDOM要素は非表示にして残す
                if(modeId === "EXTERIOR"){

                    initFpView();

                    if(configIntView){
                       //configIntView.hideStage();
					   configIntView.hide();
                    }
                    configView.showStage();

                    //$('#exteriorItems').show();
                    //$('#interiorItems').hide();
					$('#gradeName').show();
					$('.menuTab .extTab').show();
					$('.menuTab .intTab').hide();
					$('.menuTab li.menuTab-GRD').addClass('tabOn');
					$('#GRADE_LIST').show();
					
					$('#indicator').show();
					$('#featuresSwitch').show();
					if($('#featuresSwitch .fpSwitchBtn').hasClass('on')){
						$("#func-point").show();
					}
					
					clearInterval(intSwfIntervalId);

                }else if(modeId === "INTERIOR"){

                    // initInteriorView(); // [yoshikawa] 2013/07/24 初期化タイミング変更
//                  initFpView();

                    configView.hideStage();
                    //configIntView.showStage();
					configIntView.show();

                    //$('#exteriorItems').hide();
                    //$('#interiorItems').show();
					$('#gradeName').hide();
					$('.menuTab .extTab').hide();
					$('.menuTab .intTab').show();
					$('.menuTab li.menuTab-INT_COL').addClass('tabOn');
					$('#INT_BASE').show();
					
					$('#indicator').hide();
					$('#featuresSwitch').hide();
					$("#func-point").hide();
					fpView.hideAllDescriptions();
                }

                var selectedItems = getSelectedItems();
                refreshView(selectedItems);

            });

        }

        /**
         * Items選択時のイベントリスナー
         * @method addItemSelectListner
         */
        function addItemSelectListner(){

            //　サブメニューリストの開閉
            $(".selectMenuWrapper").on('click', '.subMenuBtn', function(event) {

                event.stopPropagation();
                event.returnValue = false;
                $(this).siblings(".subMenu").toggle();

            });


            // radio形式のItemの場合
            $(".selectMenuWrapper").on('click', 'dd.radioType:not(.noConfig)', function() {

                configView.cancelLoad();

                // subMenuが開いている場合は閉じる
                var $subMenu = $(".subMenu",this);   // thisを親とするsubMenu
                if ($subMenu.is(':visible')) {
                    // 表示されている場合の処理
                    $subMenu.hide();
                }

                var itemId = $(this).attr("id");
                var idArr = itemId.split("_");
                var checkGroup =  idArr[0];
                var lastItemId = $("#" + checkGroup + " .selected").attr("id");
                var selectedItems = getSelectedItems(lastItemId, itemId);
                refreshView(selectedItems,this);

            });

            // radio形式のsubItemの場合
            $(".selectMenuWrapper").on('click', 'div.radioType:not(.noConfig)', function(event) {

                event.stopPropagation();
                event.returnValue = false;
                configView.cancelLoad();

                // var itemId = $(this).attr("id");
                var itemId = $(this).attr("data-subitemid");
				
                var idArr = itemId.split("_");
                var checkGroup =  idArr[0];
                // [2013/7/22 morikawa] ここはメインIDのidを取ってきている
                var lastItemId = $("#" + checkGroup + " .selected").attr("id");
                var selectedItems = getSelectedItems(lastItemId, itemId);
                refreshView(selectedItems,this);

            });

            // check形式のItemの場合
            $(".selectMenuWrapper").on('click', 'dd.checkType:not(.noConfig)', function() {

                configView.cancelLoad();

                var $subMenu = $(".subMenu",this);
                if ($subMenu.is(':visible')) {
                    // 表示されている場合の処理
                    $subMenu.hide();
                }

                var lastItemId = $(this).attr("id");
                toggleCheckTypeBtnId(this);

                var itemId = $(this).attr("id");
                var selectedItems = getSelectedItems(lastItemId, itemId);
                refreshView(selectedItems,this);

            });

            // check形式のsubItemの場合
            $(".selectMenuWrapper").on('click', 'div.checkType:not(.noConfig)', function(event) {

                event.stopPropagation();
                event.returnValue = false;
                configView.cancelLoad();

                // var lastItemId = $(this).attr("id");
                var lastItemId = $(this).attr("data-subitemid");
                toggleCheckTypeBtnId(this);

                // var itemId = $(this).attr("id");
                var itemId = $(this).attr("data-subitemid");
                var selectedItems = getSelectedItems(lastItemId, itemId);
                refreshView(selectedItems,this);

            });

            // mix形式のItemの場合
            $(".selectMenuWrapper").on('click', 'dd.mixType:not(.noConfig)', function(event) {

                configView.cancelLoad();

/*
                var $subMenu = $(".subMenu",this);
                if ($subMenu.is(':visible')) {
                    // 表示されている場合の処理
                    $subMenu.hide();
                }
*/

				var $subMenu = $(".subMenu",this);
				if($(event.target).parents('dd.selected').length==0) {
                    $subMenu.show();
                }else{
					$subMenu.hide();
				}
				

                //前回と同じアイテムをクリックした際は、チェックボックスと同じく非選択アイテム
                //前回と異なるアイテムをクリックした際は、ラジオボタンと同じ処理
                //グループ
                var itemId = $(this).attr("id");
                var idArr = itemId.split("_");
                var checkGroup =  idArr[0];
                var lastItemId = $("#"+checkGroup+" .selected").attr("id");

                //同じグループ内に選択状態のアイテムがあり、現在クリックしたアイテムと異なる場合、非表示に
                if(lastItemId && lastItemId != itemId){
                    //$("#"+lastItemId).toggleClass(selectedClsName);
                    toggleCheckTypeBtnId($("#"+lastItemId));
                }else{
                    lastItemId = $(this).attr("id");
                }
                //$(this).toggleClass(selectedClsName);
                toggleCheckTypeBtnId(this);
                itemId = $(this).attr("id");
                var selectedItems = getSelectedItems(lastItemId, itemId);
                refreshView(selectedItems,this);

            });

            // mix形式のsubItemの場合
            $(".selectMenuWrapper").on('click', 'div.mixType:not(.noConfig)', function(event) {

                event.stopPropagation();
                event.returnValue = false;
                configView.cancelLoad();

                // var itemId = $(this).attr("id");
                var itemId = $(this).attr("data-subitemid");
                var idArr = itemId.split("_");
                var checkGroup =  idArr[0];
                var lastItemId = $("#"+checkGroup+" .selected").attr("id");

                //同じグループ内に選択状態のアイテムがあり、現在クリックしたアイテムと異なる場合、非表示に
                if(lastItemId && lastItemId != itemId){
                    //$("#"+lastItemId).toggleClass(selectedClsName);
                    toggleCheckTypeBtnId($("#"+lastItemId));
                }else{
                    lastItemId = $(this).attr("data-subitemid");
                }
                //$(this).toggleClass(selectedClsName);
                toggleCheckTypeBtnId(this);
                // itemId = $(this).attr("id");
                itemId = $(this).attr("data-subitemid");
                var selectedItems = getSelectedItems(lastItemId, itemId);
                refreshView(selectedItems,this);

            });

        }


        /**
         * Angleの読み込み状態のイベントリスナー
         * @method addConfigViewListner
         */
        function addConfigViewListner(){
			
			var angles = configView.getNumAngleStep();
			var $indicators = $('#indicator ul li');
			$indicators.eq(angles/2).addClass('on');

            // [morikawa] configViewの引数にコールバックで渡せるようにする？？

            $(configView).on('singleAngleLoad', function(e){

                // TODO インジケータの処理など
                var angle = e.angle;
                // console.log("--------------singleAngleLoad angle is ",angle);
				
				angle = angle+angles/2;
				if(angle>=angles){
					angle -= angles;
				}
				$indicators.eq(angle).addClass('loaded');

            });

            $(configView).on('angleChange', function(e){

                // TODO angle変更時の処理など
                var angle = e.angle;
                fpView.hideAllDescriptions();
                fpView.changeAngle(angle);
				
				angle = angle+angles/2;
				if(angle>=angles){
					angle -= angles;
				}
				$indicators.removeClass('on');
				$indicators.eq(angle).addClass('on');



            });

            // TODO $(configView).off


        }


        // -------------------------------------------------
        //  UI構築
        //      指定Gardeの Interior / ExteriorのItems要素
        // -------------------------------------------------

        /**
         * gradeにひもづくitem/relation/combinationのJSONを読み込む
         * 
         * @method loadGradeSetting
         * @param  {String} grade 表示対象のgrade
         */
        function loadGradeSetting(grade)
        {
            //[maru]grade_listをconfigCoreから取得
            //var gradeData = jsonPath(configCore.grade_list.grade, "$[..items[?(@.label=='"+grade+"')]")[0];
            if(grade){
                //var gradeData = jsonPath(gradeList, "$[.."+grade+"]")[0];
                var gradeData = jsonPath(gradeList, "$[..items[?(@.item_id=='"+grade+"')]")[0];
	            $(configCore).bind("loadComplete",gradeSettingLoadHandler);
	            $(configCore).bind("loadFailed",function(){});
	            configCore.loadSetting(gradeData);
            }
        }

        /**
         * items選択用のDOMを構築する
         * @method gradeSettingLoadHandler
         */
        var gradeSettingLoadHandler = function()
        {
            $(configCore).unbind("loadComplete");
            $(configCore).unbind("loadFailed");
			
			$("#EXT_BACKGROUND div.slideAreaWrap").empty();
			$("#EXT_BODY_COLOR div.slideAreaWrap").empty();
			$("#EXT_WHEEL div.slideAreaWrap").empty();
			$("#EXT_OPTION_ACCESSORY div.slideAreaWrap").empty();
			$("#INT_BASE div.slideAreaWrap").empty();
			
            selectedGradeItem = configCore.item_list;
            selectedGradeRelation = configCore.materials_list;
            selectedGradeCombination = configCore.combination_list;

/*
            // Exterior用要素
            // configView.createSelection("#GROUP_BACKGROUND", selectedGradeItem.bc,"#TMPL_ITEM");
            configView.createSelection("#EXT_BACKGROUND div.slideAreaWrap", selectedGradeItem.BACKGROUND,"#TMPL_ITEM");
            configView.createSelection("#EXT_BODY_COLOR div.slideAreaWrap", selectedGradeItem.BODYCOLOR,"#TMPL_ITEM");
            configView.createSelection("#EXT_WHEEL div.slideAreaWrap", selectedGradeItem.WHEELS,"#TMPL_ITEM");
            configView.createSelection("#EXT_OPTION_ACCESSORY div.slideAreaWrap ",selectedGradeItem.EXT_OPTION, "#TMPL_ITEM");

            // Interior用要素
            configView.createSelection("#INT_BASE", selectedGradeItem.INT_BASE,"#TMPL_ITEM");
*/

			// Exterior用要素
            // configView.createSelection("#GROUP_BACKGROUND", selectedGradeItem.bc,"#TMPL_ITEM");
            var bgJson = jsonPath(selectedGradeItem, "$[.[?(@.category_id=='BACKGROUND')]");
            if(bgJson)
            {
                configView.createSelection("#EXT_BACKGROUND div.slideAreaWrap", bgJson[0],"#TMPL_ITEM"); 
            }
            var bcJson = jsonPath(selectedGradeItem, "$[.[?(@.category_id=='BODYCOLOR')]");
            if(bcJson)
            {
                configView.createSelection("#EXT_BODY_COLOR div.slideAreaWrap", bcJson[0],"#TMPL_ITEM");
				
				// ツートンアイテムを下段に並べる処理
				var span = 78;
				var left = 16;
				$("#EXT_BODY_COLOR div.slideAreaWrap .BC").each(function(){
					var bcid = $(this).attr("id");
					if(bcid.split("_").length>2){
						$(this).css({
							position: "absolute",
							top: "113px",
							left: left + "px"
						});
						left+=span;
					}
				});
            }
            var whJson = jsonPath(selectedGradeItem, "$[.[?(@.category_id=='WHEELS')]");
            if(whJson)
            {
                configView.createSelection("#EXT_WHEEL div.slideAreaWrap", whJson[0],"#TMPL_ITEM");
            }
            var opJson = jsonPath(selectedGradeItem, "$[.[?(@.category_id=='EXT_OPTION')]");
            if(opJson)
            {
                configView.createSelection("#EXT_OPTION_ACCESSORY div.slideAreaWrap", opJson[0], "#TMPL_ITEM");
            }

            // Interior用要素
            var intJson = jsonPath(selectedGradeItem, "$[.[?(@.category_id=='INT_BASE')]");
            if(intJson)
            {
                configView.createSelection("#INT_BASE div.slideAreaWrap", intJson[0],"#TMPL_ITEM");
            }

            // FP用要素
            initFpView();
			
			// [yoshikawa] 2013/7/24 インテリア用Viewの初期化
			initInteriorView();

            // 初期表示
            // TODO [morikawa] exterior と interior のクラス付けの規則の検討
            // 小文字 or 大文字 / id or class
            //$('#' + firstMode).addClass(selectedClsName);
            var selectedMode = $("#modeSelect"+' .selected');
            if(selectedMode){
            $('#' + selectedMode[0].id.toLowerCase() + "Items" ).show();
            }
            var selectedItems = getSelectedItems();
            refreshView(selectedItems);
			
			
			// スライドメニューの初期化
			setSlideArea("#EXT_WHEEL");
			setSlideArea("#EXT_OPTION_ACCESSORY");

        };


        // -------------------------------------------------
        //  Item選択時の処理
        //      (item取得, バリデート, マテリアルリスト取得, 画像ロード)
        // -------------------------------------------------

        /**
         * 現在選択状態のitem idを取得し、バリデートを行う
         * 
         * @method getSelectedItems
         * @param  {String} lastItemId 変更前のitem id
         * @param  {String} itemId     クリックされたitemのitem id
         * @return {Object} validated_items バリデート済みitem id
         */
        function getSelectedItems(lastItemId,itemId){

            var selected_items =[],
                grade = $("#GRADE_LIST dd"+".GRD.selected").attr('id'),
                background = $("#EXT_BACKGROUND dd"+".BG.selected").attr('id'),
                bodyColor = $("#EXT_BODY_COLOR dd"+".BC.selected").attr('id'),
                wheel = $("#EXT_WHEEL dd"+".WH.selected").attr('id'),
                ext_option = [],

                //[sx4 20130625 maru]インテリア追加
                interior = $("#INT_BASE dd"+".INTBASE.selected").attr('id');
                // targetIndex;

            //ラジオボタン形式の場合は、選択されているID（１つ）を取得する
            var targetDOM = $("#EXT_OPTION_ACCESSORY dd"+".radioType.selected");
            $.each(targetDOM,function(){
                var checkRegExp = new RegExp("\\b"+this.id+"\\b");
                var searchStr = ext_option.join(",");
                if(!checkRegExp.test(searchStr)){
                    ext_option.push(this.id);
                }
            });

            //ラジオボタン形式以外の場合は、サブメニュー含めてID全部を取得する
            //([,]区切りはすべてのセレクタにマッチ)
            targetDOM = $("#EXT_OPTION_ACCESSORY .checkType,#EXT_OPTION_ACCESSORY .mixType");
                $.each(targetDOM,function(){
                    var _id = $(this).attr("data-subitemid");
                    if(!_id){
                        _id = this.id;
                    }
                    // var checkRegExp = new RegExp("\\b"+this.id+"\\b");
                    var checkRegExp = new RegExp("\\b" + _id + "\\b");
                    var searchStr = ext_option.join(",");
                    if(!checkRegExp.test(searchStr)){
                        // ext_option.push(this.id);
                        ext_option.push(_id);
                    }
            });

            selected_items.push(grade,background, bodyColor, wheel);
            selected_items = selected_items.concat(ext_option);

            //[sx4 20130625 maru]インテリアの選択状態も取得する
            selected_items.push(interior);

            // 選択されたitemを先頭に格納する
            if(lastItemId && itemId){
                selected_items = changeFirstItem(selected_items,lastItemId, itemId);
            }

            //[20120117>validate結果の戻り値を変更し、選択アイテム、非選択アイテム、自動変更アイテム、の３つが戻ってきます]
            var validated_items = configCore.validate(selected_items);

            return validated_items;
        }

        //[sx4 20130719 maru]選択されたitemを先頭に格納する
        function changeFirstItem(items,lastItemId, itemId){

            //var itemIdExt = selected_items.indexOf(itemId);
            //var targetIndex = $.inArray(itemId,selected_items);
            var checkRegExp = new RegExp("\\b"+itemId+"\\b");
            var searchStr = items.join(",");
            if(!checkRegExp.test(searchStr)){
               checkRegExp = new RegExp("\\b"+lastItemId+"\\b");
            }
            searchStr = searchStr.replace(checkRegExp,"");
            searchStr = (searchStr.charAt(0) == ",") ? 
                        searchStr.replace(",", "") : ((searchStr.charAt(searchStr.length-1) == ",") ? 
                            searchStr.replace("/,/$", ""):searchStr.replace(",,", ","));
            items = searchStr.split(",");
            items.unshift(itemId);
/*
            //イレギュラー処理！の案
            //GLグレード(GLダミーも)でE_001を非選択（E_001_I)にした際、
            //非表示のC_001_Iを強制的に、非表示のまま選択状態（C_001）にする
            if((($("#GRADE_LIST dd"+".GRD.selected").attr('id') == "GRD_GL") ||
             ($("#GRADE_LIST dd"+".GRD.selected").attr('id') == "GRD_GL_D"))&&
                (lastItemId == "E_001") && 
                ($("#C_001_I").css('display') == "none") && 
                ($("#C_001_I").find(".selected").length == 0)){
                items = changeFirstItem(items,"C_001_I","C_001");
            }
*/
            return items;
        }

        /**
         * 画面表示用のMaterialのフルパスを取得する
         * 
         * @method getDisplayMaterials
         * @param  {Array} validated_select_items バリデート済みitem id
         * @return {Array} materials 画面表示用のMaterialのフルパスとlayer番号の組
         */
        function getDisplayMaterials(validated_select_items){

            var mode = $(".modeBtn" + ".selected").attr("id");

            if (mode === "EXTERIOR"){

                return configCore.getDisplayMaterials(selectedGradeRelation.EXT, validated_select_items);

            }else if (mode === "INTERIOR"){

                // return configCore.getDisplayMaterials(selectedGradeRelation.INT, validated_select_items);
                // return;
                return configCore.getDisplayMaterials(selectedGradeRelation.INT, validated_select_items);

            }

        }

        /**
         * displayTarget（コンフィグ結果表示エリア）に画像を読み込む
         * 
         * @method loadImages
         * @param  {Array} materials 画面表示用のMaterialのフルパスとlayer番号の組
         */
        function loadImages(materials){

            var mode = $(".modeBtn" + ".selected").attr("id");

            if (mode === "EXTERIOR"){
                configView.preloadManager(materials);
            }else if (mode === "INTERIOR"){
                //configIntView.preloadManager(materials);

                //[sx4 20130625 maru]インテリア連携用ダミー関数の呼び出し
                changeInteriorImgs(materials);
            }

        }

        // -------------------------------------------------
        //  Viewの更新
        // -------------------------------------------------

         /**
         * Interior(Flash/JS)に画像を読み込む
         * 
         * @method changeInteriorImgs
         * @param  {Array} materials 画面表示用の画像フォルダ名とlayer番号の組
         *          [{"layer":0,"material":"INT-BASE_GLX-BG_001"},{}...]
         */
        function changeInteriorImgs(materials){
			//materialsフォルダへのパス（grade_list.jsonより）
            //例：　"materials/"
			var materialDirPath = gradeList.materialDirPath;
			
			// 実際に読込む画像ファイルパス： materialDirPath + material + "/" + material + "_01" + ".png";
            // 例：　materials/INT-BASE_GLX-BG_001/INT-BASE_GLX-BG_001_01.png
			
			if(!isSD){
				// PC
				// Flash側のEI準備が整うまで繰り返す
				clearInterval(intSwfIntervalId);
				var swfObj;
				intSwfIntervalId = setInterval(function(){
					try{
						swfObj = (navigator.appName.indexOf("Microsoft") != -1) ? window["InteriorView"] : document["InteriorView"];
						swfObj.setMaterials(materialDirPath, materials);
						clearInterval(intSwfIntervalId);
					}catch(e){
						//console.log(e);
					}
				}, 200);
			}else{
				// SmartDevice
				
				// [TODO] レイヤー対応（現状はベース画像の切り替えのみ）
				var material = materials[0]["material"];
				var path = materialDirPath + material + "/" + material;
				
				$('#INT_BOX_Z1 img').attr('src', path+'_01.jpg');
				$('#INT_BOX_Z2 img').attr('src', path+'_04.jpg');
				$('#INT_BOX_X1 img').attr('src', path+'_03.jpg');
				$('#INT_BOX_X2 img').attr('src', path+'_02.jpg');
				$('#INT_BOX_Y1 img').attr('src', path+'_05.jpg');
				$('#INT_BOX_Y2 img').attr('src', path+'_06.jpg');
			}
			
			$('#loadingIndicator').stop(true).show(10).delay(2000).hide(10);
        }
		
		

        /**
         * Viewを更新する
         * 
         * @method refreshView
         * @param  {Object} validated_items バリデート済みアイテムid。
         * @param  {Array} validated_items.selectItems 選択item
         * @param  {Array} validated_items.disabledItems 非選択アイテム。この配列のアイテムは、ユーザに選択できない旨を分からせる。
         * @param  {Object} validated_items.autoChangeItems 自動変更アイテム。keyは元々選択していたアイテム。valueは新しく選択するべきアイテム。替わったことをユーザに通知する。
         * @param  {jQueryObject} preSelected 変更のトリガーとなったクリックされたDOM要素
         */
        function refreshView(validated_items,preSelected){
			
			// 読み込みインジケータを初期化
			$('#indicator ul li').removeClass('loaded');

            // var res = changeItems(validated_items.autoChangeItems);

            // [2013/4/16] Item変更のアラートを出さない。 
            var res = true;

            // 以下の場合Viewを更新
            // ・Item変更のアラート画面で「OK」選択時
            // ・autoChangeItemsが無い場合
            if(res){

                refreshSelectedItems(validated_items.selectItems);
                changeDisabledItemsStyle(validated_items.disabledItems);
                var materials = getDisplayMaterials(validated_items.selectItems);

                if(materials){
                    loadImages(materials);
                }

            }else{
                // idを元の状態に戻す
                toggleCheckTypeBtnId(preSelected);
            }
			
			// グレード、ボディカラーラベル表示
			var bcLabel = $('#EXT_BODY_COLOR .selected .itemLabel').text();
			var grdLabel = $('#GRADE_LIST .selected .itemLabel').text();
			$('#gradeName p.bcLabel').text(bcLabel);
			$('#gradeName p.grdLabel').text(grdLabel);
			$('#EXT_BODY_COLOR span.bcLabel').text(bcLabel);
        }

        /**
         * Viewの選択状態を更新する
         * @method refreshSelectedItems
         * @param  {Array} validated_items 選択表示対象のid
         */
        function refreshSelectedItems(validated_items){

            for (var i = 0; i < validated_items.length; i++) {

                var itemId = validated_items[i];

                if(!itemId){ continue; }

                var idArr = itemId.split("_"),
                    checkGroup =  idArr[0],
                    checkRegExp = new RegExp(NOT_SELECTED_ID_STR+"$"),
                    $mainMenu = $("#" + itemId),
                    $subMenu = $('[data-subitemid="' + itemId + '"]');

                var size = $mainMenu.size() || $subMenu.size();

                // itemIdが付加されている要素が存在する場合
                if(size){

                    if($mainMenu.hasClass("radioType") || $subMenu.hasClass("radioType")){

                        // ラジオボタンの場合(自身を選択状態にし、それ以外ははずす)
                        $("#"+checkGroup).find(".selected").removeClass(selectedClsName);

                        // メインメニューの内容の書き換え
                        if($subMenu.size()>0){
                            $mainMenu = updateMainManuLabel($mainMenu, $subMenu, itemId);
                        }

                        // サブメニューも含めて選択状態とする
                        $mainMenu.addClass(selectedClsName);
                        $subMenu.addClass(selectedClsName);

                    }else{

                        if(checkRegExp.test(itemId)){
                            // 非選択状態とする
                            $mainMenu.removeClass(selectedClsName);
                            $subMenu.removeClass(selectedClsName);
                        }else{

                            // メインメニューの内容の書き換え
                            if($subMenu.size()>0){
                                $mainMenu = updateMainManuLabel($mainMenu, $subMenu, itemId);
                            }

                            // 選択状態とする
                            $mainMenu.addClass(selectedClsName);
                            $subMenu.addClass(selectedClsName);

                        }
                    }

                // itemIdが付加されている要素が存在しない場合
                // = itemIdの貼り替えが必要な場合
                }else{

                    // [maruyama] 選択しているかは関係なく、getToggledItemIdしたitemIdを、変更前のアイテムとする
                    //var lastSelecteItem = $("#"+checkGroup).find(".selected");
                     var lastItem = $("#"+getToggledItemId(itemId));

                    // チェックボックス＆MIのみ処理
                    if(lastItem.size()>0 && !lastItem.hasClass("radioType")){

                        // サブメニューも含めてIDの張替えを行う
                        var lastItemId = getToggledItemId(itemId);

                        $mainMenu = $("#"+checkGroup).find("#"+lastItemId);
                        $subMenu = $("#"+checkGroup).find('[data-subitemid="' + lastItemId + '"]');

                        $mainMenu.toggleClass(selectedClsName);
                        $subMenu.toggleClass(selectedClsName);
                        $mainMenu.attr("id",itemId);
                        $subMenu.attr("data-subitemid",itemId);

                    }

                }

            }
        }

        /**
         * 自動変更対象のitemに警告用のスタイルを付加する
         * @method changeDisabledItemsStyle
         * @param  {Array} disabled_items 自動変更対象のitem
         */
        function changeDisabledItemsStyle(disabled_items){

            $("." + selectNoticeClsName).removeClass(selectNoticeClsName);

            for (var i = 0; i < disabled_items.length; i++) {
                var $target = $("#" + disabled_items[i]);

                if($target.size() === 0){
                    var targetId = getToggledItemId(disabled_items[i]);
                    $target = $("#" + targetId);
                }else{
                    //radioボタンの場合など
                    if($target.hasClass("selected")){
                        $target.removeClass(selectedClsName);
                    }
                }

                $target.addClass(selectNoticeClsName);
            }

        }

        /**
         * 自動変更対象のitemをユーザに提示する。
         * @method changeItems
         * @param  {Object} items 自動変更対象のitem id
         * @return {Boolean}      自動変更許可の可否
         */
        function changeItems(items){

            var message = "次のアイテムの選択状態が変更されます\n\n";
            var length = 0;
            // var res;

            for(var key in items){
                if(items.hasOwnProperty(key)){
                    //console.log(key);

                    var $target = $("#" + items[key]);
                    if($target.size() > 0){
                        message = message + "[変更前]" + key + "　　[変更後]" + items[key] + "\n";
                    }else{
                        var checkRegexp = new RegExp(NOT_SELECTED_ID_STR+"$");
                        if(checkRegexp.test(key))
                        {
                            //非選択＞選択
                            message = message + "[選択]" + key + "\n";
                        }else
                        {
                            //選択＞非選択
                            message = message + "[選択解除]" + key + "\n";
                        }
                    }

                    length++;
                }
            }

            if(length === 0){
                return true;
            }

            //maru:暫定的にこの機能はオフとする
            return true;
            //return window.confirm(message);

        }


        // -------------------------------------------------
        //  [Util]  type:checkのボタンのId名の切替
        // -------------------------------------------------

        /**
         * checkタイプ/mixタイプのメインメニューの情報を更新する
         * @method updateMainManuLabel
         * @param  {jQueryObject} mainMenu メインメニューのdd要素
         * @param  {jQueryObject} subMenu サブメニューのdiv要素
         * @param  {String} newId 新しく付加されるitemId
         * @return {jQueryObject} subMenuの親となるメインメニュー
         */
        function updateMainManuLabel(mainMenu, subMenu, newId){

            if(mainMenu.size()>0){
                mainMenu = $(subMenu.closest("dd")[0]);
            }

            // var $mainMenu = $(subMenu.closest("dd")[0]);
            mainMenu.attr("id", newId);
            // mainMenu.find(".itemId")[0].innerHTML = newId;
            mainMenu.find(".itemLabel")[0].innerHTML = subMenu.find(".itemLabel")[0].innerHTML;
            mainMenu.find(".itemDescription")[0].innerHTML = subMenu.find(".itemDescription")[0].innerHTML;
            return mainMenu;

        }

        /**
         * チェックタイプのItemの非選択/選択状態のidを切り替える
         * @method toggleCheckTypeBtnId
         * @param  {jQueryObject} targetObj 変更対象の要素
         */
        function toggleCheckTypeBtnId(targetObj){

            var itemId = $(targetObj).attr("id");
            if(!itemId){
                itemId = $(targetObj).attr("data-subitemid");
            }
            var newItemId = getToggledItemId(itemId);
            //サブメニューも含めて選択状態とする
            var idArr = itemId.split("_");
            var checkGroup =  idArr[0];

            var mainMenu = $("#"+checkGroup+" #"+itemId).attr("id",newItemId);
            if(mainMenu.size() === 0){
                $("#"+checkGroup+" dd."+checkGroup).attr("id",newItemId);
            }
            $("#"+checkGroup).find('[data-subitemid="' + itemId + '"]').attr('data-subitemid',newItemId);

        }

        /**
         * チェックタイプのItem idの 非選択/選択 状態のidを取得する
         * @method getToggledItemId
         * @param  {String} itemId 現在のid
         * @return {String} itemId 変更後のid
         */
        function getToggledItemId(itemId){

            // 末尾がNOT_SELECTED_ID_STRのもの
            var re = new RegExp(NOT_SELECTED_ID_STR+"$");
            if(re.test(itemId)){
                //末尾のみ
                return itemId.replace(re,"");
            }else{
                //選択アイテムの場合
                return itemId+NOT_SELECTED_ID_STR;
            }

        }
		
		
		 /**
         * 指定カテゴリ内の選択状態アイテムを取得しSUMMARYに表示する
         * @method addSummaryItem
         * @param  {jQueryObject} target SUMMARY内の要素
		 * @param  {String} titleLabel カテゴリタイトル
		 * @param  {jQueryObject} lists 取得対象となるカテゴリの要素
		 * @param  {Boolean} showDescription descriptionの表示有無
         */
		function addSummaryItem(target, titleLabel, lists, showDescription){
			$('<dt>').text(titleLabel).appendTo(target);
			var $items = $(lists).find('.'+selectedClsName).not('.subMenu .'+selectedClsName);
			for(var i=0; i< $items.length; i++){
				if($items.eq(i).css('display') != 'none'){
					var html = '<dd><span class="itemLabel">'+$items.eq(i).find('.itemLabel').html()+'</span><span class="itemDescription" style="display:'+(showDescription?"block":"none")+'">'+$items.eq(i).find('.itemDescription').html()+'</span></dd>';
					$(html).appendTo(target);
				}
			}
		}
		
		
		
		function setSlideArea(target){
			
			// 表示エリアの幅
			var areaW = $("#selectMenu .selectMenuWrapper").width(); //var areaW = $("#selectMenu").width();
			// アイテムひとつ分の幅
			var itemW = $(".slideAreaWrap dl dd", target).outerWidth(true);
			// １画面内に収まるアイテム数
			var pageItemLength = Math.floor(areaW/itemW);
			// 横スライドするピクセル数
			var slideSpanW = pageItemLength*itemW;
			// アイテム数
//			var itemLength = $(".slideAreaWrap dl dd[style!='display: none;']", target).length;		//20150304 IE8スライドエリアの算出不具合修正
			var itemLength = $(".slideAreaWrap dl dd", target).filter(function(){return ($(this).css('display')!='none');}).length;
			// ページ数
			var pageLength = Math.floor((itemLength-1)/pageItemLength);
			
			
			var currentPage = 0;
			var $slideAreaWrap = $(".slideAreaWrap", target);
			$slideAreaWrap.css('margin-left', '0px');
			
			var $pageIndicator = $(".slideNavi .pageIndicator", target);
			$pageIndicator.empty();
			for(var i=0; i<=pageLength; i++){
				$('<li>').appendTo($pageIndicator);
			}
			$(".slideNavi .pageIndicator li", target).eq(0).addClass('on');
			
			if(pageLength<1){
				// 収まってたら非表示
				$(".slideNavi", target).hide();
			}else{
				$(".slideNavi", target).show();
			}
			
			
			$(".slideNavi .slideL", target).off('click');
			$(".slideNavi .slideL", target).on('click', function() {
				currentPage--;
				if(currentPage<0)currentPage=0;
				$slideAreaWrap.stop(true).animate({marginLeft: currentPage*-slideSpanW+'px'}, 500);
				$(".slideNavi .pageIndicator li", target).removeClass('on');
				$(".slideNavi .pageIndicator li", target).eq(currentPage).addClass('on');
			});
			$(".slideNavi .slideR", target).off('click');
			$(".slideNavi .slideR", target).on('click', function() {
				currentPage++;
				if(currentPage>pageLength)currentPage=pageLength;
				$slideAreaWrap.stop(true).animate({marginLeft: currentPage*-slideSpanW+'px'}, 500);
				$(".slideNavi .pageIndicator li", target).removeClass('on');
				$(".slideNavi .pageIndicator li", target).eq(currentPage).addClass('on');
			});
		}


        // -------------------------------------------------
        //  初期化
        // -------------------------------------------------

        $(function () {
            initialize();
        });

}());
