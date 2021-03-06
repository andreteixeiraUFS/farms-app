(function () {
    'use strict';

    angular
        .module('app')
        .controller('SelectionController', SelectionController);

    SelectionController.$inject = ['SelectionService', 'StudyService', 'ProjectService', 'ProtocolService', 'FlashService', '$rootScope', '$http', '$location', '$cookieStore', '$state'];

    /****** Begin SelectionController *****/
    function SelectionController(SelectionService, StudyService, ProjectService, ProtocolService, FlashService, $rootScope, $http, $location, $cookieStore, $state) {
        var vm = this;

        vm.dataLoading = false;

        vm.roleResearcher = {};
        vm.studies = [];
        vm.study = {};
        vm.members = [];
        vm.all_rated = [];

        vm.page = false;
        vm.assign_manually = false;
        vm.changeAssignType = changeAssignType;

        vm.review = {};

        vm.reviews = [];

        vm.studiesInConflict = [];

        vm.selection = {};

        vm.getAllStudies = getAllStudies;
        vm.getAllRated = getAllRated;
        vm.getAllMembers = getAllMembers;
        vm.getAllReviews = getAllReviews;

        vm.getConfiguration = getConfiguration;
        vm.saveConfiguration = saveConfiguration;

        vm.assignManual = assignManual;
        vm.assignAuto = assignAuto;

        vm.studiesByFilter = studiesByFilter;
        vm.dsTitleSearch = "";
        vm.nrYearSearch = "";
        vm.nmAuthorSearch = "";

        // Pagination functions
        vm.range = range;
        vm.prevPage = prevPage;
        vm.pageCount = pageCount;
        vm.nextPage = nextPage;
        vm.setPage = setPage;


        vm.showReadForm = showReadForm;
        vm.clearForm = clearForm;
        vm.realizeReview = realizeReview;

        vm.finalize = false;
        vm.loadCriteria = loadCriteria;
        vm.criterias = [];

        initController();

        function clearForm() {
            vm.study = null;
        }

        function showReadForm(study) {
            clearForm();
            vm.study = study;
            $('#read-modal-form-title').text(study.dsTitle);
            $('#read-modal-form').modal({ backdrop: 'static', keyboard: false, show: true, closable: false });
        }


        function initController() {
            vm.dataLoading = true;
            vm.getAllStudies();
            vm.getConfiguration();
            vm.getAllRated();
            vm.getAllMembers();
            vm.getAllReviews();
            getRoleResearcher();
            vm.loadCriteria();
            getStudiesInConflict();
            vm.dataLoading = false;
        }

        function getRoleResearcher() {
            var currentProject = $cookieStore.get("currentProject");
            var roleResearcher = {};
            if (currentProject != null) {
                roleResearcher.dsKey = currentProject.dsKey;
            }
            roleResearcher.dsUserName = $rootScope.globals.currentUser.dsUsername;
            ProjectService.GetRoleBydsKey(roleResearcher.dsKey, roleResearcher.dsUserName).then(function (response) {
                vm.roleResearcher = response;
            });
        }

        function getAllRated() {
            SelectionService.GetAllRated().then(function (response) {
                vm.all_rated = response;
            });
        }

        function getAllMembers() {
            vm.dataLoading = true;
            var currentProject = $cookieStore.get("currentProject");
            var dsKey = null;
            if (currentProject != null) {
                dsKey = currentProject.dsKey
            }
            ProjectService.GetMembersByDsKey(dsKey).then(function (response) {
                var members = response;
                vm.members = members;
                vm.dataLoading = false;
                if (response.code === 2008) {
                    FlashService.Error(response.description, false);
                    vm.lDataLoading = false;
                }
            });
        }

        function getAllStudies() {
            vm.dataLoading = true;
            var currentProject = $cookieStore.get("currentProject");
            var dsKey = null;
            if (currentProject != null) {
                dsKey = currentProject.dsKey;
            }
            StudyService.GetStudiesByDsKey(dsKey).then(function (response) {
                var studies = response;
                vm.studies = studies;
                vm.dataLoading = false;
            });
        }

        function getConfiguration() {
            vm.dataLoading = true;
            var currentProject = $cookieStore.get("currentProject");
            var dsKey = null;
            if (currentProject != null) {
                dsKey = currentProject.dsKey;
            }
            SelectionService.GetConfiguration(dsKey).then(function (response) {
            	if(response.code != 999){
                vm.selection = response;
            	}
                if (response != "") {
                    vm.selection.dhStartSelectionStep = new Date(vm.selection.dhStartSelectionStep);
                    vm.selection.dhEndSelectionStep = new Date(vm.selection.dhEndSelectionStep);
                    vm.selection.dhConflictsSolvingEnd = new Date(vm.selection.dhConflictsSolvingEnd);
                    vm.selection.dhReviewEnd = new Date(vm.selection.dhReviewEnd);
                }
                vm.dataLoading = false;
            });
        }

        function getAllReviews() {
            vm.dataLoading = true;
            var currentProject = $cookieStore.get("currentProject");
            var dsKey = null;
            if (currentProject != null) {
                dsKey = currentProject.dsKey;
            }
            var dsSSO = $rootScope.globals.currentUser.dsUsername;
            SelectionService.GetReviews(dsKey, dsSSO).then(function (response) {
                vm.reviews = response;
                vm.dataLoading = false;
            });
        }

        function getStudiesInConflict() {
        	vm.dataLoading = true;
            var currentProject = $cookieStore.get("currentProject");
            var dsKey;
            if (currentProject != null) {
                dsKey = currentProject.dsKey;
            }
            SelectionService.GetStudiesInConflict(dsKey).then(function (response) {
                vm.studiesInConflict = response;
            });
            vm.dataLoading = false;
        }


        function saveConfiguration() {
        	vm.dataLoading = true;
            var currentProject = $cookieStore.get("currentProject");
            if (currentProject != null) {
                vm.selection.idProject = currentProject.idProject;
            }
            vm.selection.dhStartSelectionStep = new Date(vm.selection.dhStartSelectionStep);
            vm.selection.dhEndSelectionStep = new Date(vm.selection.dhEndSelectionStep);
            vm.selection.dhConflictsSolvingEnd = new Date(vm.selection.dhConflictsSolvingEnd);
            vm.selection.dhReviewEnd = new Date(vm.selection.dhReviewEnd);
            SelectionService.SaveConfiguration(vm.selection).then(function (response) {
                if (response.code === 1028) {
                    FlashService.Success(response.description, false);
                    getConfiguration();
                } else {
                    FlashService.Error(response.description, false);
                    vm.dataLoading = false;
                }
            });
            vm.dataLoading = false;
        }

        function changeAssignType() {
            if (vm.assign_manually == true) {
                vm.assign_manually = false;
            } else {
                vm.assign_manually = true;
            }
        }

        function assignManual() {
        	vm.dataLoading = true;
            vm.review.dhAssign = new Date();
            SelectionService.AssignManual(vm.review).then(function (response) {
                if (response.code === 1029 || response.code === 2012) {
                    FlashService.Success(response.description, false);
                    alert(response.description);
                    vm.assign_manually = false;
                }
                else {
                    FlashService.Error(response.description, false);
                    alert(response.description);
                }
            });
            vm.dataLoading = false;
        }

        function assignAuto() {
        	vm.dataLoading = true;
            vm.assign_manually = false;
            var currentProject = $cookieStore.get("currentProject");
            var dsKey;
            if (currentProject != null) {
                dsKey = currentProject.dsKey;
            }
            SelectionService.AssignAuto(dsKey).then(function (response) {
                if (response.code === 1029 || response.code === 2012) {
                    FlashService.Success(response.description, false);
                    //   alert(response.description);
                }
                else {
                    FlashService.Error(response.description, false);
                }
            });
            vm.dataLoading = false;
        }


        function realizeReview(review) {
            vm.finalize = false;
            SelectionService.RealizeReview(review).then(function (response) {
                if (response.code === 1030) {
                    FlashService.Success( "'"+review.study.dsTitle+"' - "+response.description, false);
                    //alert(response.description);
                } else {
                    FlashService.Error(response.description, false);
                    alert(response.description);
                }
            });
        }


        function loadCriteria() {
            var currentProject = $cookieStore.get("currentProject");
            var dsKey = {};
            if (currentProject != null) {
                dsKey = currentProject.dsKey;
            }
            ProtocolService.GetSelectionCriteriasByDsKey(dsKey).then(function (response) {
                vm.criterias = response;
            });
        }

        /****** Start filter functions *****/
        function studiesByFilter() {
            return vm.reviews.filter(function (study) {
                return (study.study.dsTitle.toString().indexOf(vm.dsTitleSearch) > -1
                    || study.study.dsTitle.toLowerCase().indexOf(vm.dsTitleSearch.toLowerCase()) > -1)
                    && (study.study.nrYear == null || study.study.nrYear.toString().indexOf(vm.nrYearSearch) > -1
                        || study.study.nrYear.toString().toLowerCase().indexOf(vm.nrYearSearch.toLowerCase()) > -1)
                    && (study.study.nmAuthor == null || study.study.nmAuthor.toString().indexOf(vm.nmAuthorSearch) > -1
                        || study.study.nmAuthor.toString().toLowerCase().indexOf(vm.nmAuthorSearch.toLowerCase()) > -1);
            });
        }
        /****** End filters functions *****/

        /****** Start pagination functions *****/
        vm.currentPage = 0;
        vm.itemsPerPage = 30;

        function pageCount() {
            return Math.ceil(vm.studiesByFilter().length / vm.itemsPerPage) - 1;
        };

        function range() {
            var rangeSize = 7;
            var ps = [];
            var start;

            start = vm.currentPage;
            if (start > vm.pageCount() - rangeSize) {
                start = vm.pageCount() - rangeSize + 1;
            }

            for (var i = start; i < start + rangeSize; i++) {
                if (i >= 0) {
                    ps.push(i);
                }
            }
            return ps;
        };

        function prevPage() {
            if (vm.currentPage > 0) {
                vm.currentPage--;
            }
        };

        function nextPage() {
            if (vm.currentPage < vm.pageCount()) {
                vm.currentPage++;
            }
        };

        function setPage(pageNumber) {
            vm.currentPage = pageNumber;
        };
        /****** End pagination functions *****/
    }
    /****** Start pager *****/
    angular
        .module('app')
        .filter('pagination', function () {
            return function (input, start) {
                start = parseInt(start, 10);
                return input.slice(start);
            };
        });
    /****** End pager *****/
})();
