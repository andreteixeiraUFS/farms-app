(function () {
  'use strict';

  angular
    .module('app')
    .controller('MemberController', MemberController);

  MemberController.$inject = ['MemberService', 'ProjectService', 'FlashService', '$rootScope', '$http', '$location', '$cookieStore', '$state'];

  /****** Begin MemberController *****/
  function MemberController(MemberService, ProjectService, FlashService, $rootScope, $http, $location, $cookieStore, $state) {
    var vm = this;

    //vm.dataLoading = true;

    // Member
    vm.member = {};
    vm.members = [];

    //show buttons
    vm.roleResearcher = {};

    // Invite
    vm.invite = {};

    vm.clearForm = clearForm;
    vm.closeModal = closeModal;
    vm.showMemberInvitationForm = showMemberInvitationForm;

    vm.getAllMembers = getAllMembers;

    vm.inviteMember = inviteMember;

    vm.inactiveMember = inactiveMember;
    vm.deleteConfirm = deleteConfirm;
    vm.activeMember = activeMember;

    vm.membersByFilter = membersByFilter;
    vm.nmResearcherSearch = "";

    // Pagination functions
    vm.range = range;
    vm.prevPage = prevPage;
    vm.pageCount = pageCount;
    vm.nextPage = nextPage;
    vm.setPage = setPage;

    initController();

    function initController() {
      vm.getAllMembers();
      getRoleResearcher();
    }

    // Forms
    function clearForm() {
      vm.member = null;
      //vm.flMember = null;
      vm.invite = null;
    }

    function closeModal() {
      $('#member-invitation-modal-form').modal('hide');
      $('#confirmation-message-modal').modal('hide');
    }

    function showMemberInvitationForm() {
      clearForm();
      $('#member-invitation-modal-form-title').text("Member Invitation");
      $('#member-invitation-modal-form').modal({ backdrop: 'static', keyboard: false, show: true, closable: false });
    }

    function showConfirmationMessage() {
      $('#confirmation-message-modal-title').text("Do you really want to inactive this member?");
      $('#confirmation-message-modal-message').text("This member not be able to participate in this project.");
      $('#confirmation-message-modal').modal({ backdrop: 'static', keyboard: false, show: true, closable: false });
    }

    // CRUD functions

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



    function inviteMember() {
      vm.dataLoading = true;
      var currentProject = $cookieStore.get("currentProject");
      var dsKey = null;
      if (currentProject != null) {
        vm.invite.dsKey = currentProject.dsKey;
      }

      MemberService.Invite(vm.invite).then(function (response) {
        if (response.code === 1010) {
          FlashService.Success(response.description, false);
          vm.invite = null;
          vm.getAllMembers();
        } else if (response.code === 2009) {
          FlashService.Warning(response.description, false);
        }
        else {
          FlashService.Error(response.description, false);
          vm.dataLoading = false;
        }
        closeModal();
        vm.dataLoading = false;
      });
    };


    function inactiveMember(member) {
      vm.member = member;
      if (member.tpRole == 'Coordinator') {
        FlashService.Error('You are coordinator of this project, you can not inactive.', false);
      } else {
        showConfirmationMessage();
      }
    }

    function deleteConfirm() {
      closeModal();
      MemberService.Delete(vm.member.idProjectMember).then(function (response) {
        if (response.code === 1031) {
          vm.member = null;
          getAllMembers();
          FlashService.Success(response.description, false);
        } else {
          FlashService.Error(response.description, false);
        }
      });
    }

    function activeMember(member) {
      MemberService.ActiveMember(member.idProjectMember).then(function (response) {
        if (response.code === 1032) {
          FlashService.Success(response.description, false);
          $state.go($state.current, {}, { reload: true });
        } else {
          FlashService.Error(response.description, false);
        }
      });
    }

    /****** Start filter functions *****/
    function membersByFilter() {
      return vm.members.filter(function (member) {
        return (member.nmResearcher.toString().indexOf(vm.nmResearcherSearch) > -1
          || member.nmResearcher.toLowerCase().indexOf(vm.nmResearcherSearch.toLowerCase()) > -1);
      });
    };
    /****** End filters functions *****/

    /****** Start pagination functions *****/
    vm.currentPage = 0;
    vm.itemsPerPage = 30;

    function pageCount() {
      return Math.ceil(vm.membersByFilter().length / vm.itemsPerPage) - 1;
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

  } /****** End MemberController *****/

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
